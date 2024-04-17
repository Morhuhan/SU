package TRPO.SU.DAOs;

import TRPO.SU.RowMappers.JsonNodeRowMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.Setter;
import org.json.JSONException;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Setter
@Getter
public class DAO {

    private JdbcTemplate jdbcTemplate;

    public DAO(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<JsonNode> getDataFromTable(String tableName, int pageNumber, int itemsPerPage) throws DataAccessException {
        String sql = "SELECT * FROM получить_страницу_из_таблицы(?, ?, ?)";
        return jdbcTemplate.query(sql, new JsonNodeRowMapper(), tableName, pageNumber, itemsPerPage);
    }

    public JsonNode addDataToTable(String tableName, JsonNode jsonNode) throws DataAccessException  {
        String jsonString = jsonNode.toString();
        String sql = "SELECT * FROM добавить_запись_в_таблицу(?, ?::json)";
        return jdbcTemplate.queryForObject(sql, new JsonNodeRowMapper(), tableName, jsonString);
    }

    public void editDataToTable(JsonNode dataNode, JsonNode uniqueKeysNode, String tableName) throws DataAccessException {
        String uniqueData = uniqueKeysNode.toString();
        String dataValues = dataNode.toString();
        String sql = "CALL изменить_запись_в_таблице(?, ?::json, ?::json)";
        jdbcTemplate.update(sql, tableName, uniqueData, dataValues);
    }

    public void deleteDataFromTable(JsonNode uniqueKeysNode, String tableName) throws DataAccessException {
        String uniqueData = uniqueKeysNode.toString();
        String sql = "CALL удалить_запись_из_таблицы(?, ?::json)";
        jdbcTemplate.update(sql, tableName, uniqueData);
    }

    public int getDataCountFromTable(String tableName) throws DataAccessException {
        String sql = "SELECT получить_количество_записей(?)";
        return jdbcTemplate.queryForObject(sql, Integer.class, tableName);
    }
}