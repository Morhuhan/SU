package TRPO.SU.Controllers;

import lombok.SneakyThrows;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @SneakyThrows
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<?> handleDatabaseException(DataAccessException e) {
        HttpHeaders headers = new HttpHeaders();
        JSONObject responseBody = new JSONObject();
        responseBody.put("error", "Database access error: " + e.getMessage());
        responseBody.put("status", HttpStatus.BAD_REQUEST.value());
        return new ResponseEntity<>(responseBody.toString(), headers, HttpStatus.BAD_REQUEST);
    }
}