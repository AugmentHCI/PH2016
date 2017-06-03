package json;

import java.util.List;

/**
 * Created by robindecroon on 24/07/15.
 */
public class ExportJson {

    private String name;
    private String birthdate;
    private String weight;
    private String gender;
    private DetectedObject[] objects;
    private List<String> episodes;
    private List<String> intollerances;
    private List<String> otherMedications;
    private MedHelpErrorType errorType = MedHelpErrorType.NONE;
    private String errorMessage = "null";

    public ExportJson() {
    }

    public ExportJson(String name) {
        this.name = name;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getWeight() {
        return weight;
    }

    public void setWeight(String weight) {
        this.weight = weight;
    }

    public String getBirthdate() {
        return birthdate;
    }

    public void setBirthdate(String birthdate) {
        this.birthdate = birthdate;
    }

    public DetectedObject[] getObjects() {
        return objects;
    }

    public void setObjects(DetectedObject[] objects) {
        this.objects = objects;
    }

    public List<String> getEpisodes() {
        return episodes;
    }

    public void setEpisodes(List<String> episodes) {

        this.episodes = episodes;
    }

    public MedHelpErrorType getErrorType() {
        return errorType;
    }

    public void setErrorType(MedHelpErrorType errorType) {
        this.errorType = errorType;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public List<String> getIntollerances() {
        return intollerances;
    }

    public void setIntollerances(List<String> intollerances) {
        this.intollerances = intollerances;
    }

    public List<String> getOtherMedications() {
        return otherMedications;
    }

    public void setOtherMedications(List<String> otherMedications) {
        this.otherMedications = otherMedications;
    }

    public String getName() {

        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public enum MedHelpErrorType {
        NONE, DATABASE, CAMERA, DETECTION, OTHER;
    }
}
