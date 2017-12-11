package main.rest;

import main.exceptions.APPInternalServerException;
import main.exceptions.ErrorCode;
import main.helpers.APPCrypt;
import main.helpers.APPResponse;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;


@Path("share")
public class SharedCalendarInterface {
    public SharedCalendarInterface() {
    }

    @GET
    @Path("/encrypt/{calendarId}")
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse encrypt(@PathParam("calendarId") String calendarId) {
        String encryptedData = null;
        try {
            encryptedData = APPCrypt.encrypt(calendarId);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new APPResponse(encryptedData);
    }

    @GET
    @Path("/decrypt")
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse decrypt(@QueryParam("encryptedData") String encryptedData) {
        String calendarId;
        try {
            calendarId = APPCrypt.decrypt(encryptedData);
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Cannot find shared calendar");
        }
        return new APPResponse(calendarId);
    }
}
