import asyncio

from app.seed.loader import seed

if __name__ == "__main__":
    asyncio.run(seed())
