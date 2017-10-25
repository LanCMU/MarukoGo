package main.helpers;


import main.exceptions.APPUnauthorizedException;
import main.exceptions.ErrorCode;
import org.bson.Document;
import org.json.JSONException;
import org.json.JSONObject;

import javax.ws.rs.core.HttpHeaders;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;



public class Util {
    public final static String DATE_FORMAT = "yyyy-MM-dd HH:mm";

    public static String getStringFromDate(Document item) {
        if (item.containsKey("remindTime")) {
            SimpleDateFormat format = new SimpleDateFormat(DATE_FORMAT);
            return format.format(item.getDate("remindTime"));
        } else {
            return "";
        }
    }

    public static Date getDateFromString(JSONObject json) throws JSONException, ParseException {
        SimpleDateFormat format = new SimpleDateFormat(DATE_FORMAT);
        return format.parse(json.getString("remindTime"));
    }


    public static void checkAuthentication(HttpHeaders headers, String id) throws Exception {
        List<String> authHeaders = headers.getRequestHeader(HttpHeaders.AUTHORIZATION);
        if (authHeaders == null)
            throw new APPUnauthorizedException(ErrorCode.NO_AUTHORIZATION_HEADERS.getErrorCode(),
                    "No Auhthorization Headers");
        String token = authHeaders.get(0);
        String clearToken = APPCrypt.decrypt(token);
        if (id.compareTo(clearToken) != 0) {
            throw new APPUnauthorizedException(ErrorCode.INVALID_TOKEN.getErrorCode(),
                    "Invalid token. Please try getting a new token");
        }
    }
}
