package main;

import com.google.gson.Gson;
import json.DetectedObject;
import json.DoublePoint;
import org.bytedeco.javacv.*;

import java.io.File;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static org.bytedeco.javacpp.opencv_core.*;
import static org.bytedeco.javacpp.opencv_imgcodecs.CV_LOAD_IMAGE_GRAYSCALE;
import static org.bytedeco.javacpp.opencv_imgcodecs.cvLoadImage;
import static org.bytedeco.javacpp.opencv_imgproc.*;
import static spark.Spark.get;


public class App {


    private static final boolean SHOW = false;

    private static String jsonResponse = "";

    public static void main(String[] args) throws Exception {
        // start SPARK with json route
        get("/json", (req, res) -> getJsonResponse());

        // Read files to be detected
        File dir = new File("data/");
        File[] directoryListing = dir.listFiles();
        int numberOfItems = directoryListing != null ? directoryListing.length : 0;
        String[] objectNames = new String[numberOfItems];
        IplImage[] objects = new IplImage[numberOfItems];
        for (int i = 0; i < numberOfItems; i++) {
            objectNames[i] = directoryListing[i].toString();
            objects[i] = cvLoadImage(objectNames[i], CV_LOAD_IMAGE_GRAYSCALE);
        }
        DetectedObject[] detectedObjects = new DetectedObject[numberOfItems];
        for (int i = 0; i < numberOfItems; i++) {
            detectedObjects[i] = new DetectedObject(objectNames[i]);
        }

        // start camera, number indicated which camera
        FrameGrabber grabber = new OpenCVFrameGrabber(0);
        grabber.start();

        // open frame to SHOW image and detections
        final CanvasFrame correspondFrame = new CanvasFrame("Object Correspond");


        final OpenCVFrameConverter.ToIplImage converter = new OpenCVFrameConverter.ToIplImage();

        ObjectFinder.Settings settings = new ObjectFinder.Settings();
        settings.setUseFLANN(true);
        settings.setRansacReprojThreshold(5);

        settings.setObjectImage(cvLoadImage(objectNames[0], CV_LOAD_IMAGE_GRAYSCALE)); // hack want mag niet met null geïnitialiseerd worden
        ObjectFinder finder = new ObjectFinder(settings);

        Gson gson = new Gson();

        ScheduledExecutorService exec = Executors.newSingleThreadScheduledExecutor();
        exec.scheduleAtFixedRate(() -> {
            try {
                Frame imageFrame = grabber.grab();
                IplImage src = converter.convertToIplImage(imageFrame);

                IplImage image = cvCreateImage(cvGetSize(src), IPL_DEPTH_8U, 1);
                cvCvtColor(src, image, CV_BGR2GRAY);// memory leak!!! But NEEDED

                IplImage correspond = null;
                if (SHOW) {
                    // needed to show visual output
                    correspond = IplImage.create(image.width(), image.height(), 8, 1);
                    cvCopy(image, correspond);
                }

                for (int k = 0; k < numberOfItems; k++) {

                    settings.setObjectImage(objects[k]);
                    finder.setSettings(settings);

                    long start = System.currentTimeMillis();
                    double[] dst_corners = finder.find(image);
                    System.out.println("Finding time for " + objectNames[k] + " = " + (System.currentTimeMillis() - start) + " ms");

                    if (dst_corners != null) {
                        int leftUpX = (int) Math.round(dst_corners[0]);
                        int leftUpY = (int) Math.round(dst_corners[1]);
                        int leftDownX = (int) Math.round(dst_corners[6]);
                        int leftDownY = (int) Math.round(dst_corners[7]);
                        int rightUpX = (int) Math.round(dst_corners[2]);
                        int rightUpY = (int) Math.round(dst_corners[3]);
                        int rightDownX = (int) Math.round(dst_corners[4]);
                        int rightDownY = (int) Math.round(dst_corners[5]);

                        // test if 'square'
                        if (leftUpX < rightUpX &&
                                leftDownX < rightDownX &&
                                leftUpX < rightDownX &&
                                leftDownX < rightUpX &&
                                leftUpY < leftDownY &&
                                rightUpY < rightDownY &&
                                leftUpY < rightDownY &&
                                rightUpY < leftDownY
                                ) {
                            detectedObjects[k] = new DetectedObject(objectNames[k], new DoublePoint(leftUpX, leftUpY), new DoublePoint(leftDownX, leftDownY), new DoublePoint(rightUpX, rightUpY), new DoublePoint(rightDownX, rightDownY));
                        }

                        // draw bounding box around object
                        if (SHOW) {
                            line(cvarrToMat(correspond), new Point(leftUpX, leftUpY), new Point(leftDownX, leftDownY), Scalar.WHITE, 1, 8, 0);
                            line(cvarrToMat(correspond), new Point(leftUpX, leftUpY), new Point(rightUpX, rightUpY), Scalar.WHITE, 1, 8, 0);
                            line(cvarrToMat(correspond), new Point(rightDownX, rightDownY), new Point(leftDownX, leftDownY), Scalar.WHITE, 1, 8, 0);
                            line(cvarrToMat(correspond), new Point(rightDownX, rightDownY), new Point(rightUpX, rightUpY), Scalar.WHITE, 1, 8, 0);
                        }
                    }
                }

                setJsonResponse(gson.toJson(detectedObjects));

                if (SHOW) {
                    correspondFrame.showImage(converter.convert(correspond));
                    correspond.release();
                }

                src.release();
                image.release();

                cvCreateMemStorage().release();

            } catch (Exception e) {
                setJsonResponse("{\"error\":" + e.getMessage() + "}");
                e.printStackTrace();
            }
        }, 0, numberOfItems / 2, TimeUnit.SECONDS);

    }

    public static String getJsonResponse() {
        return jsonResponse;
    }

    public static void setJsonResponse(String jsonResponse) {
        App.jsonResponse = jsonResponse;
    }
}