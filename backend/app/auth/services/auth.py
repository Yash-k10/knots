from datetime import date
import logging
import secrets
import time
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

import app.core.base  # noqa: F401
from app.auth.repository.auth import AuthRepository

from app.auth.schemas.auth import (
    LoginOTPRequest,
    RegistrationResponse,
    ResetPasswordRequest,
    SendOTPRequest,
    SendOTPResponse,
    TokenResponse,
    UserLogin,
    UserRegister,
)
from app.core import security
from app.core.config import settings
from app.core.email import send_otp_email
from app.core.security_keys import verify_security_key
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.profiles.models.education import Education
from app.profiles.models.employment_history import EmploymentHistory
from app.profiles.models.profile import Profile
from app.users.models.role import Role
from app.users.models.user import User

import hashlib
import json
import redis

logger = logging.getLogger(__name__)

# Fallback In-memory OTP storage
OTP_STORE: dict[str, dict] = {}


def get_redis_client():
    if not settings.REDIS_URL:
        return None
    try:
        return redis.from_url(
            settings.REDIS_URL, decode_responses=True, socket_timeout=3
        )
    except Exception as e:
        logger.warning(f"Could not connect to Redis: {e}")
        return None


def hash_otp(email: str, otp: str) -> str:
    """Generate SHA-256 HMAC-style digest of the OTP bound to email and secret key."""
    salt = settings.SECRET_KEY
    payload = f"{email.strip().lower()}:{otp.strip()}:{salt}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def save_otp(email: str, otp: str, purpose: str, expires_in: int = 300) -> None:
    """Store hashed OTP with 5-minute expiry, attempt tracker, and resend cooldown."""
    normalized_email = email.strip().lower()
    now = time.time()

    # Rate limiting: 30-second resend cooldown
    existing_data = None
    r = get_redis_client()
    if r:
        try:
            raw = r.get(f"otp:{normalized_email}")
            if raw:
                existing_data = json.loads(raw)
        except Exception:
            pass

    if not existing_data:
        existing_data = OTP_STORE.get(normalized_email)

    if existing_data:
        created_at = existing_data.get("created_at", 0)
        if now - created_at < 30:
            remaining_cooldown = int(30 - (now - created_at))
            raise ValidationError(
                message=f"Please wait {remaining_cooldown} seconds before requesting a new verification code."
            )

    otp_record = {
        "otp_hash": hash_otp(normalized_email, otp),
        "expires_at": now + expires_in,
        "attempts": 0,
        "max_attempts": 5,
        "created_at": now,
        "purpose": purpose,
    }

    # 1. In-memory storage
    OTP_STORE[normalized_email] = otp_record

    # 2. Redis storage with TTL
    if r:
        try:
            r.set(
                f"otp:{normalized_email}",
                json.dumps(otp_record),
                ex=max(1, int(expires_in)),
            )
        except Exception as e:
            logger.warning(f"Failed to persist OTP to Redis: {e}")


def check_and_consume_otp(email: str, candidate_otp: str) -> bool:
    """Verify candidate OTP against stored hash, enforcing 5-min expiry, max 5 attempts, and single-use."""
    normalized_email = email.strip().lower()
    candidate_code = candidate_otp.strip()
    now = time.time()

    otp_record = None
    r = get_redis_client()

    # 1. Fetch from Redis first
    if r:
        try:
            raw = r.get(f"otp:{normalized_email}")
            if raw:
                otp_record = json.loads(raw)
        except Exception as e:
            logger.warning(f"Redis get error during OTP check: {e}")

    # 2. Fallback to in-memory
    if not otp_record:
        otp_record = OTP_STORE.get(normalized_email)

    if not otp_record:
        raise AuthenticationError(
            message="No active verification code found or code has expired. Please request a new code."
        )

    # Check Expiry (5 minutes)
    if now > otp_record.get("expires_at", 0):
        OTP_STORE.pop(normalized_email, None)
        if r:
            try:
                r.delete(f"otp:{normalized_email}")
            except Exception:
                pass
        raise AuthenticationError(
            message="Verification code expired. Please request a new code."
        )

    # Check Attempt limits
    attempts = otp_record.get("attempts", 0)
    max_attempts = otp_record.get("max_attempts", 5)

    if attempts >= max_attempts:
        OTP_STORE.pop(normalized_email, None)
        if r:
            try:
                r.delete(f"otp:{normalized_email}")
            except Exception:
                pass
        raise AuthenticationError(
            message="Too many failed attempts. This verification code has been invalidated. Please request a new code."
        )

    # Verify Hash
    candidate_hash = hash_otp(normalized_email, candidate_code)
    expected_hash = otp_record.get("otp_hash")

    if candidate_hash != expected_hash:
        attempts += 1
        otp_record["attempts"] = attempts
        remaining = max_attempts - attempts

        if attempts >= max_attempts:
            OTP_STORE.pop(normalized_email, None)
            if r:
                try:
                    r.delete(f"otp:{normalized_email}")
                except Exception:
                    pass
            raise AuthenticationError(
                message="Too many failed attempts. This verification code has been invalidated. Please request a new code."
            )
        else:
            OTP_STORE[normalized_email] = otp_record
            if r:
                try:
                    ttl = max(1, int(otp_record["expires_at"] - now))
                    r.set(
                        f"otp:{normalized_email}",
                        json.dumps(otp_record),
                        ex=ttl,
                    )
                except Exception:
                    pass
            raise AuthenticationError(
                message=f"Invalid verification code. {remaining} attempt(s) remaining."
            )

    # Successful Verification: Consume and Invalidate
    OTP_STORE.pop(normalized_email, None)
    if r:
        try:
            r.delete(f"otp:{normalized_email}")
        except Exception:
            pass

    return True


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = AuthRepository(db)

    async def authenticate_user(self, credentials: UserLogin) -> TokenResponse:
        """Authenticate registered verified user and generate access & refresh tokens."""
        user = await self.repository.get_by_email(credentials.email)
        if not user or not security.verify_password(
            credentials.password, user.hashed_password
        ):
            raise AuthenticationError(message="Invalid email or password")

        if not user.is_active:
            raise AuthenticationError(message="Account is inactive or suspended")

        if not user.is_verified:
            raise AuthenticationError(
                message="Account email is not verified. Please register with OTP verification."
            )

        access_token = security.create_access_token(subject=user.id)
        refresh_token = security.create_refresh_token(subject=user.id)

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    async def authenticate_google_token(self, token: str) -> TokenResponse:
        """Verify Google ID token cryptographically, enforce college domain (@sbjit.edu.in), and issue JWT tokens."""
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except Exception as e:
            logger.warning(f"Google token verification failed: {e}")
            raise AuthenticationError(
                message="Invalid or expired Google authentication credentials."
            )

        email = idinfo.get("email", "").strip().lower()
        if not email:
            raise AuthenticationError(
                message="Unable to retrieve email from Google token."
            )

        # Enforce authorized college domain (@sbjit.edu.in)
        allowed_domains = settings.ALLOWED_EMAIL_DOMAINS
        if not any(
            email.endswith(domain.strip().lower()) for domain in allowed_domains
        ):
            raise AuthorizationError(
                message="Access restricted: Only official college email addresses (@sbjit.edu.in) are permitted to sign in."
            )

        first_name = idinfo.get("given_name", "")
        last_name = idinfo.get("family_name", "")
        avatar_url = idinfo.get("picture", "")

        # Check if user already exists
        user = await self.repository.get_by_email(email)
        if not user:
            # Query default Student role
            role_stmt = select(Role).filter(func.lower(Role.name) == "student")
            role_res = await self.db.execute(role_stmt)
            role = role_res.scalars().first()
            if not role:
                fallback_stmt = select(Role).limit(1)
                fallback_res = await self.db.execute(fallback_stmt)
                role = fallback_res.scalars().first()

            role_id = role.id if role else 2

            # Auto-provision user account
            random_pw = secrets.token_urlsafe(16)
            hashed_password = security.hash_password(random_pw)
            user = await self.repository.create(
                {
                    "email": email,
                    "hashed_password": hashed_password,
                    "role_id": role_id,
                    "is_active": True,
                    "is_verified": True,
                }
            )

            # Auto-provision initial profile with Google profile photo and name
            profile = Profile(
                user_id=user.id,
                first_name=first_name or "Student",
                last_name=last_name or "",
                profile_picture=avatar_url or None,
                department="Engineering",
                bio="Student at SBJIT.",
            )
            self.db.add(profile)
            await self.db.flush()
        else:
            if not user.is_active:
                raise AuthenticationError(message="Account is inactive or suspended.")
            if not user.is_verified:
                user.is_verified = True
                self.db.add(user)
                await self.db.flush()

        access_token = security.create_access_token(subject=user.id)
        refresh_token = security.create_refresh_token(subject=user.id)

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    async def send_otp(self, payload: SendOTPRequest) -> SendOTPResponse:
        """Generate a 6-digit OTP for the college email address and store it with 5-minute expiry."""
        normalized_email = payload.email.strip().lower()
        allowed_domains = settings.ALLOWED_EMAIL_DOMAINS
        if isinstance(allowed_domains, str):
            allowed_domains = [
                d.strip() for d in allowed_domains.split(",") if d.strip()
            ]

        if not any(normalized_email.endswith(d.lower()) for d in allowed_domains):
            raise ValidationError(
                message="Please use your valid college email address."
            )

        if payload.purpose == "register":
            existing_user = await self.repository.get_by_email(normalized_email)
            if existing_user and existing_user.is_verified:
                raise ConflictError(
                    message="This college email address is already registered. Please sign in directly."
                )
        elif payload.purpose == "reset":
            existing_user = await self.repository.get_by_email(normalized_email)
            if not existing_user:
                raise NotFoundError(
                    message="No account found with this college email address. Please register first."
                )

        # Generate a 6-digit cryptographic-safe random OTP
        otp_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])

        # Save in Redis & in-memory cache (valid for 5 minutes / 300s)
        save_otp(normalized_email, otp_code, payload.purpose, expires_in=300)

        # Dispatch real email via SMTP
        try:
            send_otp_email(
                recipient_email=normalized_email,
                otp_code=otp_code,
                purpose=payload.purpose,
            )
        except Exception as e:
            logger.error(f"Error during send_otp_email dispatch: {e}")
            raise ValidationError(
                message="Unable to send verification email. Please try again."
            )

        return SendOTPResponse(
            message=f"Verification code sent to {normalized_email}.",
            email=normalized_email,
            expires_in_seconds=300,
        )

    async def authenticate_otp(self, payload: LoginOTPRequest) -> TokenResponse:
        """Verify OTP for college email and log user in."""
        normalized_email = payload.email.strip().lower()

        if not check_and_consume_otp(normalized_email, payload.otp):
            raise AuthenticationError(
                message="Invalid, incorrect, or expired OTP verification code. Please check your latest email or request a new code."
            )

        # Retrieve user or auto-provision
        user = await self.repository.get_by_email(normalized_email)
        if not user:
            # Map role string to Role in DB
            target_role_name = payload.role.strip()
            if target_role_name.lower() in ["management", "admin"]:
                role_query = select(Role).filter(
                    func.lower(Role.name).in_(["admin", "management"])
                )
            else:
                role_query = select(Role).filter(
                    func.lower(Role.name) == target_role_name.lower()
                )

            result = await self.db.execute(role_query)
            role = result.scalars().first()

            if not role:
                # Default to student or first role
                fallback_stmt = select(Role).limit(1)
                fallback_res = await self.db.execute(fallback_stmt)
                role = fallback_res.scalars().first()

            role_id = role.id if role else 2

            # Create new user record
            random_pw = secrets.token_urlsafe(16)
            hashed_password = security.hash_password(random_pw)
            user = await self.repository.create(
                {
                    "email": normalized_email,
                    "hashed_password": hashed_password,
                    "role_id": role_id,
                    "is_active": True,
                    "is_verified": True,
                }
            )

            # Auto-provision initial profile
            profile = Profile(
                user_id=user.id,
                first_name="Member",
                last_name="",
                department="Computer Science",
                bio="Member at SBJIT.",
            )
            self.db.add(profile)
            await self.db.flush()
        else:
            if not user.is_verified:
                user.is_verified = True
                self.db.add(user)
                await self.db.flush()

        if not user.is_active:
            raise AuthenticationError(message="Inactive or suspended account")

        access_token = security.create_access_token(subject=user.id)
        refresh_token = security.create_refresh_token(subject=user.id)

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    async def reset_password_with_otp(self, payload: ResetPasswordRequest) -> None:
        """Reset user password using authorized email OTP verification."""
        normalized_email = payload.email.strip().lower()

        if not check_and_consume_otp(normalized_email, payload.otp):
            raise AuthenticationError(
                message="Invalid, incorrect, or expired OTP verification code. Please request a new code."
            )

        user = await self.repository.get_by_email(normalized_email)
        if not user:
            raise NotFoundError(
                message="No account found with this college email address."
            )

        if len(payload.new_password) < 6:
            raise ValidationError(
                message="Password must be at least 6 characters long."
            )

        user.hashed_password = security.hash_password(payload.new_password)
        user.is_verified = True
        self.db.add(user)
        await self.db.flush()

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        """Verify refresh token and issue new access & refresh tokens."""
        payload = security.decode_token(refresh_token, expected_type="refresh")
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token claim")

        user = await self.repository.get(int(user_id))
        if not user or not user.is_active:
            raise AuthenticationError("Inactive or invalid user")

        new_access = security.create_access_token(subject=user.id)
        new_refresh = security.create_refresh_token(subject=user.id)

        return TokenResponse(access_token=new_access, refresh_token=new_refresh)

    async def register_user(self, user_in: UserRegister) -> RegistrationResponse:
        """Register a new user in the system with verified email saved in DB."""
        normalized_email = user_in.email.strip().lower()
        existing_user = await self.repository.get_by_email(normalized_email)
        if existing_user and existing_user.is_verified:
            raise ConflictError(
                message="This college email is already registered. Please sign in."
            )

        # Verify OTP verification code
        if not check_and_consume_otp(normalized_email, user_in.otp):
            raise AuthenticationError(
                message="Invalid, incorrect, or expired email OTP verification code."
            )

        # Verify Security Access Key for Controller & Central Admin
        if user_in.management_role:
            role_type = user_in.management_role.strip()
            if role_type.lower() == "controller":
                if not user_in.department:
                    raise ValidationError(
                        message="Department must be specified when registering as Department Controller."
                    )
                if not verify_security_key(
                    "Controller", user_in.department, user_in.access_key
                ):
                    raise ValidationError(
                        message=f"Invalid Controller Security Key for {user_in.department}. Please provide the authorized departmental access key."
                    )
            elif role_type.lower() in ["central admin", "central_admin", "admin"]:
                if not verify_security_key("Central Admin", None, user_in.access_key):
                    raise ValidationError(
                        message="Invalid Central Admin Master Security Key. Please provide the authorized administrator key."
                    )

        # Verify or resolve role
        target_role = None
        if user_in.management_role:
            if user_in.management_role.lower() == "controller":
                controller_stmt = select(Role).filter(
                    func.lower(Role.name) == "controller"
                )
                controller_res = await self.db.execute(controller_stmt)
                target_role = controller_res.scalars().first()
            if not target_role:
                mgmt_stmt = select(Role).filter(
                    func.lower(Role.name).in_(["management", "admin"])
                )
                mgmt_res = await self.db.execute(mgmt_stmt)
                target_role = mgmt_res.scalars().first()

        if not target_role:
            role_stmt = select(Role).filter(Role.id == user_in.role_id)
            role_result = await self.db.execute(role_stmt)
            target_role = role_result.scalars().first()

        if not target_role:
            fallback_stmt = select(Role).limit(1)
            fallback_res = await self.db.execute(fallback_stmt)
            target_role = fallback_res.scalars().first()
            if not target_role:
                raise ValidationError(message="Role not found")

        role = target_role

        # Hash password
        hashed_password = security.hash_password(user_in.password)

        if existing_user:
            existing_user.hashed_password = hashed_password
            existing_user.role_id = role.id
            existing_user.is_active = True
            existing_user.is_verified = True
            self.db.add(existing_user)
            await self.db.flush()
            user = existing_user
        else:
            user_data = {
                "email": normalized_email,
                "hashed_password": hashed_password,
                "role_id": role.id,
                "is_active": True,
                "is_verified": True,  # Verified via OTP!
            }
            user = await self.repository.create(user_data)

        # Initialize Profile with contact details and bio
        name_parts = [
            p.capitalize()
            for p in normalized_email.split("@")[0].replace("_", ".").split(".")
            if p
        ]
        first_name = name_parts[0] if name_parts else (role.name or "User")
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        # Determine department
        department_val = user_in.department if user_in.department else role.name

        # Determine customized bio and designation
        if user_in.faculty_type:
            bio_val = f"{user_in.faculty_type} at SBJIT in {department_val} Department."
        elif user_in.management_role:
            if user_in.management_role.lower() == "controller":
                bio_val = f"Department Controller for {department_val} at SBJIT (Managing departmental events, clubs, and student activities)."
            else:
                bio_val = f"{user_in.management_role} at SBJIT Management."
        elif user_in.current_company:
            bio_val = f"SBJIT Alumni working at {user_in.current_company}."
        else:
            if user_in.department and role.name and role.name.lower() == "student":
                bio_val = f"Student ({department_val}) at SBJIT."
            else:
                bio_val = f"{role.name} at SBJIT."

        if user_in.github_profile:
            bio_val += f" | GitHub: {user_in.github_profile}"

        contact_info = {
            "phone_number": user_in.phone_number,
            "github_profile": user_in.github_profile,
            "linkedin_profile": user_in.linkedin_profile,
            "leetcode_profile": user_in.leetcode_profile,
            "hackerrank_profile": user_in.hackerrank_profile,
            "tenth_percentage": user_in.tenth_percentage,
            "twelfth_or_diploma_percentage": user_in.twelfth_or_diploma_percentage,
            "gpa": user_in.gpa,
            "department": user_in.department,
            "faculty_type": user_in.faculty_type,
            "management_role": user_in.management_role,
            "access_key": user_in.access_key,
            "current_company": user_in.current_company,
        }

        profile = Profile(
            user_id=user.id,
            first_name=first_name,
            last_name=last_name,
            department=department_val,
            projects=[{"type": "contact_and_coding_profiles", "data": contact_info}],
            bio=bio_val,
        )
        self.db.add(profile)
        await self.db.flush()

        # Add EmploymentHistory record if current_company provided (for Alumni)
        if user_in.current_company:
            emp = EmploymentHistory(
                profile_id=profile.id,
                company_name=user_in.current_company,
                title=user_in.designation or "Alumni Professional / Software Engineer",
                location="India",
                start_date=date.today(),
                end_date=None,
                description=f"Current working organization: {user_in.current_company}",
            )
            self.db.add(emp)

        # Add Education records if 10th / 12th / GPA provided (primarily for Students)
        if user_in.tenth_percentage is not None:
            edu_10 = Education(
                profile_id=profile.id,
                institution_name="Secondary School Education",
                degree="10th Standard (SSC / Matriculation)",
                field_of_study="General Studies",
                start_date=date(2018, 6, 1),
                end_date=date(2019, 5, 31),
                gpa=float(user_in.tenth_percentage),
                description=f"10th Grade Score: {user_in.tenth_percentage}%",
            )
            self.db.add(edu_10)

        if user_in.twelfth_or_diploma_percentage is not None or user_in.gpa is not None:
            score_val = user_in.twelfth_or_diploma_percentage or user_in.gpa
            edu_12 = Education(
                profile_id=profile.id,
                institution_name="Higher Secondary / Polytechnic Board",
                degree="12th (HSC / Intermediate) or Diploma",
                field_of_study="Science / Engineering",
                start_date=date(2019, 6, 1),
                end_date=date(2021, 5, 31),
                gpa=float(score_val) if score_val else None,
                description=f"12th / Diploma Qualification Score: {score_val}%",
            )
            self.db.add(edu_12)

        await self.db.flush()

        # Generate email verification token
        verification_token = security.create_verification_token(subject=user.id)

        return RegistrationResponse(user=user, verification_token=verification_token)

    async def verify_email(self, token: str) -> User:
        """Verify user's email using a verification token."""
        payload = security.decode_token(token, expected_type="verification")
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError(message="Invalid token claim")

        user = await self.repository.get(int(user_id))
        if not user:
            raise NotFoundError(message="User not found")

        if user.is_verified:
            return user

        user.is_verified = True
        self.db.add(user)
        await self.db.flush()
        return user

    async def logout_user(self, user_id: int) -> None:
        """Stateless logout (placeholder for token blacklisting)."""
