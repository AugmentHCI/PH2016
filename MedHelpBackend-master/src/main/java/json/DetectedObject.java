package json;

public class DetectedObject {

    private String name;

    private boolean found;

    private DoublePoint leftUp;
    private DoublePoint leftDown;
    private DoublePoint rightUp;
    private DoublePoint rightDown;

    // nodig voor GSON
    public DetectedObject() {

    }

    public DetectedObject(String name) {
        super();
        this.name = name;
        this.found = false;
    }

    public DetectedObject(String name, DoublePoint leftUp, DoublePoint leftDown, DoublePoint rightUp, DoublePoint rightDown) {
        super();
        this.name = name;
        this.leftUp = leftUp;
        this.leftDown = leftDown;
        this.rightUp = rightUp;
        this.rightDown = rightDown;
        this.found = true;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    /**
     * @return the leftUp
     */
    public DoublePoint getLeftUp() {
        return leftUp;
    }

    /**
     * @param leftUp the leftUp to set
     */
    public void setLeftUp(DoublePoint leftUp) {
        this.leftUp = leftUp;
    }

    /**
     * @return the leftDown
     */
    public DoublePoint getLeftDown() {
        return leftDown;
    }

    /**
     * @param leftDown the leftDown to set
     */
    public void setLeftDown(DoublePoint leftDown) {
        this.leftDown = leftDown;
    }

    /**
     * @return the rightUp
     */
    public DoublePoint getRightUp() {
        return rightUp;
    }

    /**
     * @param rightUp the rightUp to set
     */
    public void setRightUp(DoublePoint rightUp) {
        this.rightUp = rightUp;
    }

    /**
     * @return the rightDown
     */
    public DoublePoint getRightDown() {
        return rightDown;
    }

    /**
     * @param rightDown the rightDown to set
     */
    public void setRightDown(DoublePoint rightDown) {
        this.rightDown = rightDown;
    }


}
