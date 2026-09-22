import asyncio
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

def unwrap(res):
    try:
        j = res.json()
        if isinstance(j, dict) and "data" in j:
            return j["data"]
        return j
    except Exception:
        return res.text

async def main():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:

        # 1. Login as CSE Controller
        res_ctrl = await client.post("/auth/login", json={"email": "controller.cse@sbjit.edu.in", "password": "Password@123"})
        if res_ctrl.status_code != 200:
            print(f"Controller login failed: {res_ctrl.text}")
            return
        ctrl_token = unwrap(res_ctrl)["access_token"]
        ctrl_headers = {"Authorization": f"Bearer {ctrl_token}"}
        print("Logged in as CSE Controller.")

        # 2. Login as Faculty (faculty.demo@sbjit.edu.in / password123)
        res_fac = await client.post("/auth/login", json={"email": "faculty.demo@sbjit.edu.in", "password": "password123"})
        if res_fac.status_code != 200:
            res_fac = await client.post("/auth/login", json={"email": "faculty@sbjit.edu.in", "password": "password123"})
            if res_fac.status_code != 200:
                print(f"Failed to login as faculty: {res_fac.text}")
                return
        fac_data = unwrap(res_fac)
        fac_token = fac_data["access_token"]
        fac_headers = {"Authorization": f"Bearer {fac_token}"}

        
        # Get faculty profile
        fac_me = await client.get("/users/me", headers=fac_headers)
        fac_user = unwrap(fac_me)
        fac_id = fac_user["id"]
        print(f"Logged in as Faculty: {fac_user['email']} (ID: {fac_id})")

        # 3. Check what clubs this faculty sees right now before appointment
        clubs_res = await client.get("/clubs", headers=ctrl_headers)
        all_clubs = unwrap(clubs_res)
        print(f"Total clubs in system: {len(all_clubs)}")
        if len(all_clubs) == 0:
            print("No clubs exist, creating test club...")
            new_club = await client.post("/clubs", headers=ctrl_headers, json={
                "name": "CSE Coding Society",
                "category": "CSE",
                "description": "Official CSE society"
            })
            test_club_id = unwrap(new_club)["id"]
        else:
            test_club_id = all_clubs[0]["id"]

        # Reset coordinator to None first
        await client.put(f"/clubs/{test_club_id}/coordinator", headers=ctrl_headers, json={"faculty_id": None})

        # 4. As Faculty, check /clubs list: MUST BE 0 (or strictly only clubs where they are coordinator)
        fac_clubs_res = await client.get("/clubs", headers=fac_headers)
        fac_clubs = unwrap(fac_clubs_res)
        print(f"Faculty sees {len(fac_clubs)} clubs before appointment: {[c['name'] for c in fac_clubs]}")
        assert all(c.get("faculty_coordinator_id") == fac_id for c in fac_clubs), "Faculty sees uncoordinated clubs!"

        # 5. As Faculty, try to access uncoordinated club detail: MUST BE 403 Forbidden!
        uncoord_detail = await client.get(f"/clubs/{test_club_id}", headers=fac_headers)
        print(f"Faculty accessing uncoordinated club detail: Status {uncoord_detail.status_code}")
        assert uncoord_detail.status_code == 403, f"Expected 403, got {uncoord_detail.status_code}: {uncoord_detail.text}"

        # 6. Controller appoints this Faculty as Coordinator of test_club_id
        appoint_res = await client.put(f"/clubs/{test_club_id}/coordinator", headers=ctrl_headers, json={"faculty_id": fac_id})
        print(f"Controller appointing faculty coordinator: Status {appoint_res.status_code}")
        assert appoint_res.status_code == 200

        # 7. As Faculty, check /clubs list: MUST now contain ONLY test_club_id!
        fac_clubs_res2 = await client.get("/clubs", headers=fac_headers)
        fac_clubs2 = unwrap(fac_clubs_res2)
        print(f"Faculty sees {len(fac_clubs2)} clubs after appointment: {[c['name'] for c in fac_clubs2]}")
        assert any(c["id"] == test_club_id for c in fac_clubs2), "Appointed club not found in faculty list!"
        assert all(c.get("faculty_coordinator_id") == fac_id for c in fac_clubs2), "Faculty sees clubs where they are NOT coordinator!"

        # 8. As Faculty, access appointed club detail: MUST BE 200 OK with role FACULTY_COORDINATOR
        coord_detail = await client.get(f"/clubs/{test_club_id}", headers=fac_headers)
        print(f"Faculty accessing coordinated club detail: Status {coord_detail.status_code}")
        assert coord_detail.status_code == 200
        detail_json = unwrap(coord_detail)
        print(f"Club: {detail_json['name']}, User Role: {detail_json['user_role']}, Coord ID: {detail_json['faculty_coordinator_id']}")
        assert detail_json["user_role"] == "FACULTY_COORDINATOR"
        assert detail_json["faculty_coordinator_id"] == fac_id

        # 9. As Faculty, update club details (Management power)
        update_res = await client.put(f"/clubs/{test_club_id}", headers=fac_headers, json={
            "description": "Updated by Faculty Coordinator!\nClassroom Link: https://classroom.google.com/c/test-fac"
        })
        print(f"Faculty managing/updating club: Status {update_res.status_code}")
        assert update_res.status_code == 200

        print("\nSUCCESS: All faculty scoping, controller appointment, and coordinator management verifications passed cleanly!")

if __name__ == "__main__":
    asyncio.run(main())
