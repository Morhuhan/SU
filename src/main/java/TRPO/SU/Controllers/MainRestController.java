package TRPO.SU.Controllers;

import TRPO.SU.Services.MainService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Getter;
import lombok.Setter;
import lombok.SneakyThrows;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@Setter
@Getter
public class MainRestController {

    private final MainService mainService;
    private final ObjectMapper objectMapper;

    @Autowired
    public MainRestController(MainService mainService, ObjectMapper objectMapper) {
        this.mainService = mainService;
        this.objectMapper = objectMapper;
    }

    @SneakyThrows
    @PostMapping("/getPage")
    public ResponseEntity<?> getData(@RequestBody JsonNode jsonNode) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        JSONObject responseBody = new JSONObject();
        JSONArray data = mainService.getDataFromTable(jsonNode);
        responseBody.put("data", data);
        return new ResponseEntity<>(responseBody.toString(), headers, HttpStatus.OK);
    }

    @SneakyThrows
    @PostMapping("/addData/{tableName}")
    public ResponseEntity<?> addData(@RequestBody JsonNode jsonNode,
                                     @PathVariable("tableName") String tableName) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ObjectNode responseBody = new ObjectMapper().createObjectNode();
        JsonNode data = mainService.addDataToTable(jsonNode, tableName);
        responseBody.set("data", data);
        return new ResponseEntity<>(responseBody.toString(), headers, HttpStatus.OK);
    }

    @SneakyThrows
    @PostMapping("/editData/{tableName}")
    public ResponseEntity<?> editData(
            @PathVariable("tableName") String tableName,
            @RequestBody JsonNode jsonNode) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        JSONObject responseBody = new JSONObject();
        JsonNode dataNode = jsonNode.get("data");
        JsonNode uniqueKeysNode = jsonNode.get("uniqueKeys");
        mainService.editDataToTable(dataNode, uniqueKeysNode, tableName);
        responseBody.put("message", "Data updated successfully.");
        return new ResponseEntity<>(responseBody.toString(), headers, HttpStatus.OK);
    }

    @SneakyThrows
    @PostMapping("/deleteData/{tableName}")
    public ResponseEntity<?> deleteData(
            @PathVariable("tableName") String tableName,
            @RequestBody JsonNode jsonNode) {
            JsonNode uniqueKeysNode = jsonNode.get("uniqueKeys");
            mainService.deleteDataFromTable(uniqueKeysNode, tableName);
            return ResponseEntity.ok().build();
    }

    @SneakyThrows
    @PostMapping("/getCount/{tableName}")
    public ResponseEntity<?> getCount(
            @PathVariable("tableName") String tableName) {
        int count = mainService.getDataCountFromTable(tableName);
        return ResponseEntity.ok(count);
    }
}
