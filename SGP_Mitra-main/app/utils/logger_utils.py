import logging
import os
from datetime import datetime

def get_logger(name=None):
    if name is None:
        name = __name__
    
    logger = logging.getLogger(name)
    
    # Prevent duplicate handlers
    if logger.handlers:
        return logger
    
    # Prevent propagation to root logger to avoid duplicates
    logger.propagate = False
    logger.setLevel(logging.DEBUG)
    
    # Create logs directory from environment variable (avoid circular import)
    logs_dir = os.getenv('LOGS_DIRECTORY', 'logs')
    
    if not os.path.exists(logs_dir):
        os.makedirs(logs_dir)
    
    # Create log file with timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_file = f"{logs_dir}/{timestamp}.log"
    
    # Create formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(funcName)s() - %(message)s",
        datefmt="%Y-%m-%d_%H:%M:%S"
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(formatter)
    
    # File handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    
    # Add handlers only if they don't exist
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger
