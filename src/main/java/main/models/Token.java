package main.models;

import main.helpers.APPCrypt;

public class Token {

    String token = null;
    String userId = null;
    String firstName = null;
    String lastName = null;

    public Token(User user) throws Exception{
        this.userId = user.id;
        this.token = APPCrypt.encrypt(user.id);
        this.firstName = user.firstName;
        this.lastName = user.lastName;
    }
}
