package TRPO.SU.DAOs;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.Setter;
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

    public List<String> getDataUEFromTable(JsonNode jsonNode, String invoiceNumber) throws DataAccessException {
        String sql = "SELECT * FROM получить_страницу_УЕ(?::jsonb, ?::integer)";
        String jsonText = jsonNode.toString();
        return jdbcTemplate.queryForList(sql, String.class, jsonText, invoiceNumber);
    }

    public List<String> getDataFromTable(JsonNode jsonNode) throws DataAccessException {
        String sql = "SELECT * FROM получить_страницу_из_таблицы(?::jsonb)";
        String jsonText = jsonNode.toString();
        return jdbcTemplate.queryForList(sql, String.class, jsonText);
    }

    public List<String> getPowersForEmployee(JsonNode jsonNode) throws DataAccessException {
        String sql = "SELECT * FROM получить_полномочия_сотрудника(?::jsonb)";
        String jsonText = jsonNode.toString();
        return jdbcTemplate.queryForList(sql, String.class, jsonText);
    }

    public List<String> getAllRecordsJoin(JsonNode jsonNode) throws DataAccessException {
        String sql = "SELECT * FROM public.\"получить_все_записи_join\"(?::jsonb)";
        String jsonText = jsonNode.toString();
        return jdbcTemplate.queryForList(sql, String.class, jsonText);
    }

    public List<String> getAllUE() throws DataAccessException {
        String sql = "SELECT * FROM Получить_Все_УЕ_В_Наличии()";
        return jdbcTemplate.queryForList(sql, String.class);
    }

    public String addDataToTable(String tableName, JsonNode jsonNode) throws DataAccessException  {
        String jsonString = jsonNode.toString();
        String sql = "SELECT * FROM добавить_запись_в_таблицу(?, ?::jsonb)";
        return jdbcTemplate.queryForObject(sql, String.class, tableName, jsonString);
    }

    public String editDataToTable(String tableName, JsonNode jsonNode) throws DataAccessException {
        String jsonString = jsonNode.toString();
        String sql = "SELECT * FROM изменить_запись_в_таблице(?, ?::jsonb)";
        return jdbcTemplate.queryForObject(sql, String.class, tableName, jsonString);
    }

    public List<String> getAllRecordsFromTable(String tableName) throws DataAccessException {
        String sql = "SELECT * FROM getallrecords(?)";
        return jdbcTemplate.queryForList(sql, String.class, tableName);
    }

    public String getExpandedData(JsonNode jsonNode) throws DataAccessException {
        String jsonText = jsonNode.toString();
        String sql = "SELECT * FROM получить_дополнительные_данные(?::jsonb)";
        return jdbcTemplate.queryForObject(sql, String.class, jsonText);
    }

    public int getDataCountFromTable(String tableName) throws DataAccessException {
        String sql = "SELECT получить_количество_записей(?)";
        return jdbcTemplate.queryForObject(sql, Integer.class, tableName);
    }

    public void deleteDataFromTable(String tableName, JsonNode jsonNode) throws DataAccessException {
        String jsonString = jsonNode.toString();
        String sql = "CALL удалить_запись_из_таблицы(?, ?::jsonb)";
        jdbcTemplate.update(sql, tableName, jsonString);
    }

    public void dispatchUE(JsonNode jsonNode) throws DataAccessException {
        String jsonString = jsonNode.toString();
        String sql = "CALL отправить_УЕ(?::jsonb)";
        jdbcTemplate.update(sql, jsonString);
    }

    public void checkPowers(JsonNode jsonNode) throws DataAccessException {
        String jsonString = jsonNode.toString();
        String sql = "CALL проверить_полномочие(?::jsonb)";
        jdbcTemplate.update(sql, jsonString);
    }

    public void checkUE(JsonNode jsonNode) throws DataAccessException {
        String jsonString = jsonNode.toString();
        String sql = "CALL Проверить_Допустимость_УЕ(?::jsonb)";
        jdbcTemplate.update(sql, jsonString);
    }

}