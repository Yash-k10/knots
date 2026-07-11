import logging
import sys
import json
from datetime import datetime
from app.core.config import settings

class JSONFormatter(logging.Formatter):
    """
    Custom formatter that outputs logs as JSON lines.
    Useful for production monitoring in environments like Kubernetes / Cloud logging.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcfromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "filename": record.filename,
            "line": record.lineno
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)


def setup_logging():
    root_logger = logging.getLogger()
    
    # Set default log level
    log_level = logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO
    root_logger.setLevel(log_level)

    # Clean existing handlers
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    # Create handler
    console_handler = logging.StreamHandler(sys.stdout)
    
    # Apply formatter
    if settings.ENVIRONMENT == "production":
        console_handler.setFormatter(JSONFormatter())
    else:
        # Standard clean text formatting for local development
        formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)s [%(name)s:%(lineno)d] - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        console_handler.setFormatter(formatter)

    root_logger.addHandler(console_handler)


# Run setup automatically
setup_logging()

# Provide a helper function to get named loggers
def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
