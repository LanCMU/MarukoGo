package main.exceptions;


public enum ErrorCode {
    NOT_FOUND(0),
    BAD_REQUEST(33),
    INVALID_MONGO_ID(45),
    MISSING_PROPERTIES(55),
    INVALID_VALUES(56),
    COULD_NOT_DELETE(66),
    NO_AUTHORIZATION_HEADERS(70),
    INVALID_TOKEN(71),
    INTERNAL_SERVER_ERROR(99);

    private final int error_code;

    ErrorCode(int error_code) {
        this.error_code = error_code;
    }

    public int getErrorCode() {
        return error_code;
    }
}
