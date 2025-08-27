import { ReservationModel } from "../Reservation";
import { ReservationStatus } from "../../types";

describe("ReservationModel", () => {
  const validReservationData = {
    id: "test-id",
    guestName: "John Doe",
    guestPhone: "+1234567890",
    guestEmail: "john@example.com",
    arrivalTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    tableSize: 4,
    status: ReservationStatus.REQUESTED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("constructor", () => {
    it("should create a reservation model with valid data", () => {
      const reservation = new ReservationModel(validReservationData);

      expect(reservation.id).toBe(validReservationData.id);
      expect(reservation.guestName).toBe(validReservationData.guestName);
      expect(reservation.guestPhone).toBe(validReservationData.guestPhone);
      expect(reservation.guestEmail).toBe(validReservationData.guestEmail);
      expect(reservation.arrivalTime).toBe(validReservationData.arrivalTime);
      expect(reservation.tableSize).toBe(validReservationData.tableSize);
      expect(reservation.status).toBe(validReservationData.status);
    });
  });

  describe("validate", () => {
    it("should return valid result for valid reservation data", () => {
      const reservation = new ReservationModel(validReservationData);
      const result = reservation.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate guest name is required", () => {
      const reservation = new ReservationModel({
        ...validReservationData,
        guestName: "",
      });
      const result = reservation.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestName",
        message: "Guest name is required",
        code: "REQUIRED",
      });
    });

    it("should validate guest name minimum length", () => {
      const reservation = new ReservationModel({
        ...validReservationData,
        guestName: "A",
      });
      const result = reservation.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestName",
        message: "Guest name must be at least 2 characters long",
        code: "MIN_LENGTH",
      });
    });

    it("should validate guest name maximum length", () => {
      const reservation = new ReservationModel({
        ...validReservationData,
        guestName: "A".repeat(101),
      });
      const result = reservation.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestName",
        message: "Guest name must not exceed 100 characters",
        code: "MAX_LENGTH",
      });
    });

    it("should validate phone number is required", () => {
      const reservation = new ReservationModel({
        ...validReservationData,
        guestPhone: "",
      });
      const result = reservation.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestPhone",
        message: "Phone number is required",
        code: "REQUIRED",
      });
    });

    it("should validate phone number format", () => {
      const reservation = new ReservationModel({
        ...validReservationData,
        guestPhone: "invalid-phone",
      });
      const result = reservation.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestPhone",
        message: "Invalid phone number format",
        code: "INVALID_FORMAT",
      });
    });

    it("should validate email is required", () => {
      const reservation = new ReservationModel({
        ...validReservationData,
        guestEmail: "",
      });
      const result = reservation.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestEmail",
        message: "Email address is required",
        code: "REQUIRED",
      });
    });

    it("should validate email format", () => {
      const reservation = new ReservationModel({
        ...validReservationData,
        guestEmail: "invalid-email",
      });
      const result = reservation.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestEmail",
        message: "Invalid email address format",
        code: "INVALID_FORMAT",
      });
    });

    it("should validate arrival time is in the future", () => {
      const reservation = new ReservationModel({
        ...validReservationData,
        arrivalTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      });
      const result = reservation.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message: "Arrival time must be in the future",
        code: "INVALID_DATE",
      });
    });

    it("should validate table size is positive", () => {
      const reservation = new ReservationModel({
        ...validReservationData,
        tableSize: 0,
      });
      const result = reservation.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "tableSize",
        message: "Table size must be a positive number",
        code: "INVALID_NUMBER",
      });
    });

    it("should validate table size maximum", () => {
      const reservation = new ReservationModel({
        ...validReservationData,
        tableSize: 25,
      });
      const result = reservation.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "tableSize",
        message: "Table size cannot exceed 20 people",
        code: "MAX_VALUE",
      });
    });

    it("should validate notes maximum length", () => {
      const reservation = new ReservationModel({
        ...validReservationData,
        notes: "A".repeat(501),
      });
      const result = reservation.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "notes",
        message: "Notes must not exceed 500 characters",
        code: "MAX_LENGTH",
      });
    });
  });

  describe("create", () => {
    it("should create a new reservation with default values", () => {
      const data = {
        guestName: "John Doe",
        guestPhone: "+1234567890",
        guestEmail: "john@example.com",
        arrivalTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        tableSize: 4,
      };

      const reservation = ReservationModel.create(data);

      expect(reservation.guestName).toBe(data.guestName);
      expect(reservation.status).toBe(ReservationStatus.REQUESTED);
      expect(reservation.createdAt).toBeInstanceOf(Date);
      expect(reservation.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("toJSON", () => {
    it("should convert model to plain object", () => {
      const reservation = new ReservationModel(validReservationData);
      const json = reservation.toJSON();

      expect(json).toEqual(validReservationData);
    });
  });
});
