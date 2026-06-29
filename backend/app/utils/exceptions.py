"""
Custom exception classes for the application.

Raise these in services; catch them in routers or middleware
to return proper HTTP responses.
"""


class AppException(Exception):
    """Base application exception."""

    def __init__(self, message: str = "An error occurred", status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(message=f"{resource} not found", status_code=404)


class ConflictException(AppException):
    def __init__(self, message: str = "Conflict"):
        super().__init__(message=message, status_code=409)


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request"):
        super().__init__(message=message, status_code=400)
