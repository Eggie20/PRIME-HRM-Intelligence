"""
NBSC PRIME-HRM Intelligence Hub — MongoDB Connection
Initializes connection to MongoDB using MongoEngine.
"""
import os
import logging
from mongoengine import connect, disconnect
from django.conf import settings

logger = logging.getLogger(__name__)

_CONNECTED = False


def init_mongo():
    """
    Connects MongoEngine to the configured MongoDB database.
    Safe to call multiple times (idempotent).
    """
    global _CONNECTED
    if _CONNECTED:
        return True

    mongo_settings = getattr(settings, 'MONGODB_SETTINGS', {})
    db_name = mongo_settings.get('db', os.getenv('MONGODB_NAME', 'primehrm'))
    host_uri = mongo_settings.get('host', os.getenv('MONGODB_URI', 'mongodb://localhost:27017/primehrm'))
    alias = mongo_settings.get('alias', 'default')

    try:
        connect(
            db=db_name,
            host=host_uri,
            alias=alias,
            serverSelectionTimeoutMS=2000
        )
        _CONNECTED = True
        logger.info(f"Connected to MongoDB database '{db_name}' via {host_uri}")
        return True
    except Exception as exc:
        logger.warning(f"MongoDB connection attempt failed: {exc}. App running in offline/unconnected mode.")
        return False


def close_mongo():
    """Closes MongoEngine connections."""
    global _CONNECTED
    try:
        disconnect(alias='default')
        _CONNECTED = False
    except Exception:
        pass
