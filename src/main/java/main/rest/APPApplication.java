package main.rest;

import org.glassfish.jersey.server.ResourceConfig;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;

//@ApplicationPath("/")

@Path("")

public class APPApplication extends ResourceConfig {
    public APPApplication() {
        // Define the package which contains the service classes.
        packages("main.rest");
    }

    @GET
    @Produces({ MediaType.APPLICATION_JSON})
    public Object getAll() {
        Version ver = new Version("5.1.4", "2017-09-29");
        return ver;
    }

    public class Version {
        String version, date;
        public Version(String version,String date) {
            this.version = version;
            this.date = date;
        }

    }


}