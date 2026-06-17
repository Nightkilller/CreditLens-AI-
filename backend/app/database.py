"""
CreditLens AI — Database Connection
=====================================
Supports MongoDB Atlas (via Motor async driver) with an in-memory
fallback for development without a live database.
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings


class Database:
    """MongoDB connection manager with in-memory fallback."""

    def __init__(self):
        self.client = None
        self.db = None
        self.is_memory = False
        # In-memory storage (fallback when no MongoDB URI is set)
        self._memory_store = {
            "users": [],
            "msmes": [],
            "scores": [],
        }

    async def connect(self):
        """Connect to MongoDB Atlas or fall back to in-memory storage."""
        if settings.mongodb_uri:
            try:
                self.client = AsyncIOMotorClient(settings.mongodb_uri)
                self.db = self.client[settings.db_name]
                # Test connection
                await self.client.admin.command("ping")
                print(f"✅ Connected to MongoDB Atlas ({settings.db_name})")
                self.is_memory = False
            except Exception as e:
                print(f"⚠️  MongoDB connection failed: {e}")
                print("   Falling back to in-memory storage")
                self.is_memory = True
        else:
            print("ℹ️  No MONGODB_URI set — using in-memory storage")
            print("   Set MONGODB_URI in .env to use MongoDB Atlas")
            self.is_memory = True

    async def disconnect(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            print("MongoDB connection closed")

    # ─── Collection Access ────────────────────────────────────

    @property
    def users(self):
        if self.is_memory:
            return MemoryCollection(self._memory_store, "users")
        return self.db["users"]

    @property
    def msmes(self):
        if self.is_memory:
            return MemoryCollection(self._memory_store, "msmes")
        return self.db["msmes"]

    @property
    def scores(self):
        if self.is_memory:
            return MemoryCollection(self._memory_store, "scores")
        return self.db["scores"]


class MemoryCollection:
    """
    Minimal in-memory MongoDB-like collection for development.
    Implements a subset of Motor's AsyncIOMotorCollection API.
    """

    def __init__(self, store: dict, name: str):
        self._store = store
        self._name = name

    async def insert_one(self, document: dict):
        if "_id" not in document:
            import uuid
            document["_id"] = str(uuid.uuid4())
        self._store[self._name].append(document)

        class Result:
            inserted_id = document["_id"]
        return Result()

    async def find_one(self, query: dict):
        for doc in self._store[self._name]:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    def find(self, query: dict = None, *args, **kwargs):
        """Returns a MemoryCursor that supports chaining."""
        if query is None:
            query = {}
        results = [
            doc for doc in self._store[self._name]
            if all(doc.get(k) == v for k, v in query.items())
        ]
        return MemoryCursor(results)

    async def update_one(self, query: dict, update: dict):
        for doc in self._store[self._name]:
            if all(doc.get(k) == v for k, v in query.items()):
                if "$set" in update:
                    doc.update(update["$set"])
                if "$push" in update:
                    for key, val in update["$push"].items():
                        if key not in doc:
                            doc[key] = []
                        doc[key].append(val)

                class Result:
                    modified_count = 1
                return Result()

        class Result:
            modified_count = 0
        return Result()

    async def delete_one(self, query: dict):
        for i, doc in enumerate(self._store[self._name]):
            if all(doc.get(k) == v for k, v in query.items()):
                self._store[self._name].pop(i)

                class Result:
                    deleted_count = 1
                return Result()

        class Result:
            deleted_count = 0
        return Result()

    async def count_documents(self, query: dict = None):
        if query is None:
            return len(self._store[self._name])
        return sum(
            1 for doc in self._store[self._name]
            if all(doc.get(k) == v for k, v in query.items())
        )


class MemoryCursor:
    """Supports async iteration and method chaining for in-memory queries."""

    def __init__(self, results: list):
        self._results = results
        self._skip = 0
        self._limit = None
        self._sort_key = None
        self._sort_dir = 1

    def skip(self, n: int):
        self._skip = n
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            self._sort_key = key_or_list[0][0]
            self._sort_dir = key_or_list[0][1]
        else:
            self._sort_key = key_or_list
            self._sort_dir = direction
        return self

    async def to_list(self, length=None):
        results = self._results
        if self._sort_key:
            results = sorted(
                results,
                key=lambda x: x.get(self._sort_key, ""),
                reverse=(self._sort_dir == -1)
            )
        results = results[self._skip:]
        if self._limit:
            results = results[:self._limit]
        if length:
            results = results[:length]
        return results


# Singleton database instance
database = Database()
