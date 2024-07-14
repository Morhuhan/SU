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

    @GetMapping("/position")
    public String showPosition(Model model) { return "PositionForm.html"; };

    @GetMapping("/container")
    public String showContainer (Model model) { return "ContainerForm.html"; };

    @GetMapping("/сriticallimit")
    public String showСriticallimit (Model model) { return "CriticallimitForm.html"; };

    @GetMapping("/materialtype")
    public String showmaterialType (Model model) { return "MaterialtypeForm.html"; };

    @GetMapping("/power")
    public String showpower (Model model) { return "PowersForm.html"; };

    @GetMapping("/partner")
    public String showpartner (Model model) { return "PartnerForm.html"; };

    @GetMapping("/representative")
    public String showrepresentative (Model model) { return "RepresentativeForm.html"; };

    @GetMapping("/UE_MATERIAL_FORM")
    public String showUE_MATERIAL_FORM (Model model) { return "UE_MATERIAL_FORM.html"; };
}
