package main.rest;

import main.exceptions.APPInternalServerException;
import main.exceptions.ErrorCode;
import main.helpers.APPCrypt;
import main.helpers.APPResponse;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;


@Path("share")
public class ShareInterface {
    public ShareInterface() {
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
    @Path("/decrypt/{encryptedData}")
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse decrypt(@PathParam("encryptedData") String encryptedData) {
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
