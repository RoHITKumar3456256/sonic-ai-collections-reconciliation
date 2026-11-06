import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.core.config import settings

logger = logging.getLogger("sonic_ai.database")

_mongo_client = None
_db = None
_is_mock = False

def get_database():
    global _mongo_client, _db, _is_mock
    if _db is not None:
        return _db

    uri = settings.MONGODB_URI
    db_name = settings.MONGODB_DATABASE

    try:
        # Try real MongoDB first with a short timeout
        client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        # Verify connection
        client.admin.command('ping')
        _mongo_client = client
        _db = _mongo_client[db_name]
        _is_mock = False
        logger.info(f"Connected successfully to live MongoDB at {uri}, db: {db_name}")
    except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
        logger.warning(
            f"Could not connect to MongoDB at {uri} ({e}). "
            "Falling back to high-performance in-memory mongomock database."
        )
        try:
            import mongomock
            _mongo_client = mongomock.MongoClient()
            _db = _mongo_client[db_name]
            _is_mock = True
            logger.info(f"Using mongomock in-memory database: {db_name}")
        except Exception as mock_err:
            logger.error(f"Failed to initialize mongomock: {mock_err}")
            raise mock_err

    return _db

def is_using_mock() -> bool:
    global _is_mock
    return _is_mock

def reset_db_connection():
    global _mongo_client, _db, _is_mock
    if _mongo_client:
        try:
            _mongo_client.close()
        except Exception:
            pass
    _mongo_client = None
    _db = None
    _is_mock = False

