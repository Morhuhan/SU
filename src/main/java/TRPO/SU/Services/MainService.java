package TRPO.SU.Services;

import TRPO.SU.DAOs.DAO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import org.json.JSONArray;
import org.json.JSONException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Getter
public class MainService {

    private final DAO dao;

    @Autowired
    public MainService(DAO scalesDAO) {
        this.dao = scalesDAO;
    }

    public JSONArray getDataFromTable(JsonNode jsonNode) throws DataAccessException {

        String tableName = jsonNode.get("table").asText();
        int pageNumber = jsonNode.get("page").asInt();
        int itemsPerPage = jsonNode.get("itemsPerPage").asInt();

        List<JsonNode> data = dao.getDataFromTable(tableName, pageNumber, itemsPerPage);
        JSONArray jsonArray = new JSONArray();

        for (JsonNode item : data) {
            jsonArray.put(item);
        }

        return jsonArray;
    }

    public JsonNode addDataToTable(JsonNode jsonNode, String tableName) throws DataAccessException {
        return dao.addDataToTable(tableName, jsonNode);
    }

    public void editDataToTable(JsonNode dataNode, JsonNode uniqueKeysNode, String tableName) throws DataAccessException {
        dao.editDataToTable(dataNode, uniqueKeysNode, tableName);
    }

    public void deleteDataFromTable(JsonNode uniqueKeysNode, String tableName) throws DataAccessException {
        dao.deleteDataFromTable(uniqueKeysNode, tableName);
    }

    public int getDataCountFromTable(String tableName) throws  DataAccessException {
        return dao.getDataCountFromTable(tableName);
    }

}
