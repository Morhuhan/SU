package TRPO.SU.Controllers;

import TRPO.SU.Services.MainService;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@Setter
@Getter
public class MainController {

    public final MainService mainService;

    public MainController(MainService mainService) {
        this.mainService = mainService;
    }

    @GetMapping("/scales")
    public String showScales(Model model) {
        return "scalesForm.html";
    }

}
