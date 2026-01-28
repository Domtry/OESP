from setuptools import setup, find_packages

setup(
    name="oesp-sdk",
    version="0.2.2",
    packages=find_packages(include=["oesp_sdk", "oesp_sdk.*"]),
    install_requires=[
        "PyNaCl>=1.5.0",
        "cryptography>=43.0.0",
        "bleak>=0.21.0",
        "httpx>=0.25.0",
    ],
    extras_require={
        "dev": [
            "pytest>=8.0.0",
            "pytest-asyncio>=0.23.0",
            "pytest-cov>=4.1.0",
            "black>=24.0.0",
            "isort>=5.13.0",
            "mypy>=1.8.0",
        ],
    },
    python_requires=">=3.11",
    author="OESP Team",
    author_email="dev@oesp.protocol",
    description="Offline Exchange Secure Protocol (OESP) SDK for Python",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    url="https://github.com/Domtry/OESP",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Security :: Cryptography",
    ],
)
