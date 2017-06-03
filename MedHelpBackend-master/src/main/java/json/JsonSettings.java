package json;

/**
 * Created by robindecroon on 24/07/15.
 */
public class JsonSettings {

    private String patientID;
    private boolean visualOutput;
    private String username;
    private String password;
    private String databaseURL;

    public JsonSettings() {
    }

    public String getPatientID() {

        return patientID;
    }

    public void setPatientID(String patientID) {
        this.patientID = patientID;
    }

    public boolean showVisualOutput() {
        return visualOutput;
    }

    public void setVisualOutput(boolean visualOutput) {
        this.visualOutput = visualOutput;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getDatabaseURL() {
        return databaseURL;
    }
}