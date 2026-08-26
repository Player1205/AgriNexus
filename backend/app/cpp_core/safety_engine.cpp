#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <string>
#include <vector>
#include <algorithm>
#include <unordered_set>
#include <sstream>

namespace py = pybind11;

struct SafetyResult {
    bool is_safe;
    std::string chemical_name;
    double recommended_dosage_ml_per_acre;
    std::string warning_message;
};

class SafetyEngine {
private:
    std::unordered_set<std::string> banned_chemicals;

    // A simple mock matrix of base dosages per chemical.
    // In production, this would be a loaded tensor or dense matrix.
    double calculate_dosage(const std::string& chemical, double humidity) {
        double base_dosage = 100.0; // Default 100ml per acre
        
        if (chemical == "Mancozeb") base_dosage = 250.0;
        else if (chemical == "Azoxystrobin") base_dosage = 150.0;
        else if (chemical == "Propiconazole") base_dosage = 120.0;

        // Humidity adjustment (if high humidity, slightly reduce chemical to prevent burning)
        if (humidity > 80.0) {
            base_dosage *= 0.9;
        }

        return base_dosage;
    }

public:
    SafetyEngine() {
        // CIB&RC Banned/Restricted Pesticides in India (sample)
        banned_chemicals = {
            "endosulfan", "monocrotophos", "dicofol", "methomyl", 
            "carbofuran", "phorate", "triazophos"
        };
    }

    SafetyResult evaluate_treatment(const std::string& proposed_chemical, double current_humidity) {
        // Normalize input string to lowercase for checking
        std::string chemical_lower = proposed_chemical;
        std::transform(chemical_lower.begin(), chemical_lower.end(), chemical_lower.begin(),
            [](unsigned char c){ return std::tolower(c); });

        if (banned_chemicals.find(chemical_lower) != banned_chemicals.end()) {
            return SafetyResult{
                false,
                proposed_chemical,
                0.0,
                "CRITICAL ALERT: Chemical is banned under Indian regulations. DO NOT USE."
            };
        }

        // Calculate safe dosage
        double dosage = calculate_dosage(proposed_chemical, current_humidity);
        
        std::ostringstream warning;
        if (dosage > 200.0) {
            warning << "High dosage detected. Ensure proper protective equipment.";
        } else {
            warning << "Chemical approved for usage.";
        }

        return SafetyResult{
            true,
            proposed_chemical,
            dosage,
            warning.str()
        };
    }
};

PYBIND11_MODULE(safety_engine, m) {
    m.doc() = "Deterministic C++ Safety Engine for AgriNexus pesticide evaluation";

    py::class_<SafetyResult>(m, "SafetyResult")
        .def_readonly("is_safe", &SafetyResult::is_safe)
        .def_readonly("chemical_name", &SafetyResult::chemical_name)
        .def_readonly("recommended_dosage_ml_per_acre", &SafetyResult::recommended_dosage_ml_per_acre)
        .def_readonly("warning_message", &SafetyResult::warning_message);

    py::class_<SafetyEngine>(m, "SafetyEngine")
        .def(py::init<>())
        .def("evaluate_treatment", &SafetyEngine::evaluate_treatment, 
             py::arg("proposed_chemical"), py::arg("current_humidity"));
}
