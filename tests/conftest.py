import pytest

from dooms.config import load_config


@pytest.fixture(scope="session")
def cfg():
    return load_config()
