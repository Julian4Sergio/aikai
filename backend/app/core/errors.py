class AppError(Exception):
    def __init__(self, error_code: str, error_message: str, status_code: int) -> None:
        self.error_code = error_code
        self.error_message = error_message
        self.status_code = status_code
        super().__init__(error_message)
