package com.library_web.library.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

public class UserDTO {
    private String username;
    private String email;
    private String fullname;
    private String phone;
    private String password;
    private String role = "USER"; // mặc định là USER

    private String gender;
    private String avatar_url;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthdate;

      @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate joined_date;

    // Getters và Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getFullname() {
        return fullname;
    }

    public void setFullname(String fullname) {
        this.fullname = fullname;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public LocalDate getBirthdate() {
        return birthdate;
    }

    public void setBirthdate(LocalDate birthdate) {
        this.birthdate = birthdate;
    }
    public String getAvatar_url() {
        return avatar_url;
    }
    public void setAvatar_url(String avatar_url) {
        this.avatar_url = avatar_url;
    }
    public LocalDate getJoined_date() {
        return joined_date;
    }
    public void setJoined_date(LocalDate joined_date) {
        this.joined_date = joined_date;
    }
}