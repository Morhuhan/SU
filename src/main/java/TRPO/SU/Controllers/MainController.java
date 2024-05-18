package TRPO.SU.Controllers;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@Setter
@Getter
public class MainController {

    public MainController() {}

    @GetMapping("/scales")
    public String showScales(Model model) {
        return "scalesForm.html";
    }

    @GetMapping("/ZBM")
    public String showZBM(Model model) {
        return "ZBM.html";
    }

    @GetMapping("/building")
    public String showBuilding(Model model) {
        return "BuildingForm.html";
    }

    @GetMapping("/room")
    public String showRoom(Model model) {
        return "RoomForm.html";
    }

    @GetMapping("/employee")
    public String showEmployee(Model model) {
        return "EmployeeForm.html";
    }

    @GetMapping("/invoice")
    public String showInvoice(Model model) {
        return "InvoiceForm.html";
    }

}
