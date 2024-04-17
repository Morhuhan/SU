package TRPO.SU.Objects;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.Date;

@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
@ToString
public class Scales {

    @JsonProperty("Инвентарный_номер_весов")
    private String inventoryNumber;

    @JsonProperty("Модель")
    private String model;

    @JsonProperty("Дата_калибровки")
    private Date calibrationDate;

    @JsonProperty("Предел_измерений")
    private BigDecimal measurementLimit;

    @JsonProperty("Погрешность")
    private BigDecimal error;

}