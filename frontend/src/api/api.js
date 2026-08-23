// ======================================================
// API CONFIGURATION
// ======================================================

export const API_URL =
  import.meta.env.VITE_API_URL;

// ======================================================
// COMMON REQUEST FUNCTION
// ======================================================

async function request(endpoint, options = {}) {
  const isFormData =
    options.body instanceof FormData;

  try {
    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

        headers: {
          ...(isFormData
            ? {}
            : {
              "Content-Type":
                "application/json",
            }),

          ...(options.headers || {}),
        },
      },
    );

    // ==============================================
    // RESPONSE PARSING
    // ==============================================

    const contentType =
      response.headers.get(
        "content-type",
      );

    let data = {};

    if (
      contentType &&
      contentType.includes(
        "application/json",
      )
    ) {
      data = await response
        .json()
        .catch(() => ({}));
    } else {
      const text = await response
        .text()
        .catch(() => "");

      data = text
        ? { message: text }
        : {};
    }

    // ==============================================
    // ERROR HANDLING
    // ==============================================

    if (!response.ok) {
      throw new Error(
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`,
      );
    }

    return data;
  } catch (error) {
    // ==============================================
    // NETWORK ERROR
    // ==============================================

    if (
      error instanceof TypeError
    ) {
      throw new Error(
        "Unable to connect to server. Please make sure backend is running.",
      );
    }

    throw error;
  }
}

// ======================================================
// AUTH API
// ======================================================

export const authApi = {
  // ====================================================
  // LOGIN
  // ====================================================

  login: async (credentials) => {
    if (
      !credentials ||
      typeof credentials !==
      "object"
    ) {
      throw new Error(
        "Login data is required",
      );
    }

    return await request(
      "/auth/login",
      {
        method: "POST",

        body: JSON.stringify(
          credentials,
        ),
      },
    );
  },

  // ====================================================
  // SIGNUP
  // ====================================================

  signup: async (userData) => {
    if (
      !userData ||
      typeof userData !==
      "object"
    ) {
      throw new Error(
        "Signup data is required",
      );
    }

    return await request(
      "/auth/signup",
      {
        method: "POST",

        body: JSON.stringify(
          userData,
        ),
      },
    );
  },
};

// ======================================================
// TASK API
// ======================================================

export const taskApi = {
  // ====================================================
  // GET ALL TASKS
  // ====================================================

  getAll: async (token) => {
    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    return await request(
      "/tasks",
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    );
  },

  // ====================================================
  // GET TASK BY ID
  // ====================================================

  getById: async (
    token,
    id,
  ) => {
    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    if (!id) {
      throw new Error(
        "Task ID is required",
      );
    }

    return await request(
      `/tasks/${id}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    );
  },

  // ====================================================
  // CREATE TASK
  // ====================================================

  create: async (
    token,
    title,
    description,
    classId,
    studentId,
  ) => {
    // ----------------------------------------------
    // AUTH
    // ----------------------------------------------

    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    // ----------------------------------------------
    // TITLE
    // ----------------------------------------------

    if (
      typeof title !==
      "string" ||
      !title.trim()
    ) {
      throw new Error(
        "Task title is required",
      );
    }

    const cleanTitle =
      title.trim();

    if (
      cleanTitle.length > 200
    ) {
      throw new Error(
        "Task title cannot exceed 200 characters",
      );
    }

    // ----------------------------------------------
    // DESCRIPTION
    // ----------------------------------------------

    if (
      typeof description !==
      "string" ||
      !description.trim()
    ) {
      throw new Error(
        "Task description is required",
      );
    }

    const cleanDescription =
      description.trim();

    // ----------------------------------------------
    // CLASS
    // ----------------------------------------------

    if (!classId) {
      throw new Error(
        "Class is required",
      );
    }

    // ----------------------------------------------
    // STUDENT
    // ----------------------------------------------

    if (!studentId) {
      throw new Error(
        "Student is required",
      );
    }

    // ----------------------------------------------
    // API REQUEST
    // ----------------------------------------------

    const data =
      await request(
        "/tasks",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            title: cleanTitle,
            description:
              cleanDescription,
            classId,
            studentId,
          }),
        },
      );

    return (
      data?.task ||
      data?.data ||
      data
    );
  },

  // ====================================================
  // UPDATE TASK
  // ====================================================

  update: async (
    token,
    id,
    updateData,
  ) => {
    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    if (!id) {
      throw new Error(
        "Task ID is required",
      );
    }

    if (
      !updateData ||
      typeof updateData !==
      "object"
    ) {
      throw new Error(
        "Task update data is required",
      );
    }

    const cleanData = {};

    // ----------------------------------------------
    // TITLE
    // ----------------------------------------------

    if (
      Object.prototype.hasOwnProperty.call(
        updateData,
        "title",
      )
    ) {
      if (
        typeof updateData.title !==
        "string" ||
        !updateData.title.trim()
      ) {
        throw new Error(
          "Task title is required",
        );
      }

      const title =
        updateData.title.trim();

      if (title.length > 200) {
        throw new Error(
          "Task title cannot exceed 200 characters",
        );
      }

      cleanData.title = title;
    }

    // ----------------------------------------------
    // DESCRIPTION
    // ----------------------------------------------

    if (
      Object.prototype.hasOwnProperty.call(
        updateData,
        "description",
      )
    ) {
      if (
        typeof updateData.description !==
        "string" ||
        !updateData.description.trim()
      ) {
        throw new Error(
          "Task description is required",
        );
      }

      cleanData.description =
        updateData.description.trim();
    }

    // ----------------------------------------------
    // NO CHANGES
    // ----------------------------------------------

    if (
      Object.keys(cleanData)
        .length === 0
    ) {
      throw new Error(
        "No task changes were provided",
      );
    }

    const response =
      await request(
        `/tasks/${id}`,
        {
          method: "PUT",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(
            cleanData,
          ),
        },
      );

    return (
      response?.task ||
      response?.data ||
      response
    );
  },

  // ====================================================
  // COMPLETE TASK WITH PROOF
  // ====================================================

  completeWithProof: async (
    token,
    id,
    file,
  ) => {
    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    if (!id) {
      throw new Error(
        "Task ID is required",
      );
    }

    if (!file) {
      throw new Error(
        "Please select an image",
      );
    }

    // ----------------------------------------------
    // IMAGE TYPE
    // ----------------------------------------------

    // ----------------------------------------------
    // ALLOWED FILE TYPES
    // ----------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (!file.type || !allowedTypes.includes(file.type)) {
      throw new Error(
        "Only JPG, PNG, WEBP, PDF, DOC, DOCX, PPT and PPTX files are allowed"
      );
    }

    // ----------------------------------------------
    // FILE SIZE - 100 MB
    // ----------------------------------------------

    const maxFileSize =
      100 * 1024 * 1024;

    if (file.size > maxFileSize) {
      throw new Error(
        "File size must be less than 100 MB"
      );
    }

    // ----------------------------------------------
    // FORM DATA
    // ----------------------------------------------

    const formData =
      new FormData();

    formData.append(
      "proof",
      file,
    );

    // ----------------------------------------------
    // API REQUEST
    // ----------------------------------------------

    const response =
      await request(
        `/tasks/${id}/complete`,
        {
          method: "PUT",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          // Do NOT set Content-Type manually
          body: formData,
        },
      );

    return (
      response?.task ||
      response?.data ||
      response
    );
  },

  // ====================================================
  // REVIEW TASK
  // ====================================================

  review: async (
    token,
    id,
    rating,
    teacherComment = "",
  ) => {
    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    if (!id) {
      throw new Error(
        "Task ID is required",
      );
    }

    // ----------------------------------------------
    // RATING
    // ----------------------------------------------

    const numericRating =
      Number(rating);

    if (
      !Number.isInteger(
        numericRating,
      ) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      throw new Error(
        "Rating must be between 1 and 5",
      );
    }

    // ----------------------------------------------
    // COMMENT
    // ----------------------------------------------

    const comment =
      typeof teacherComment ===
        "string"
        ? teacherComment.trim()
        : "";

    if (
      comment.length > 1000
    ) {
      throw new Error(
        "Teacher comment cannot exceed 1000 characters",
      );
    }

    // ----------------------------------------------
    // API REQUEST
    // ----------------------------------------------

    const response =
      await request(
        `/tasks/${id}/review`,
        {
          method: "PUT",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            rating:
              numericRating,
            teacherComment:
              comment,
          }),
        },
      );

    return (
      response?.task ||
      response?.data ||
      response
    );
  },

  // ====================================================
  // DELETE TASK
  // ====================================================

  delete: async (
    token,
    id,
  ) => {
    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    if (!id) {
      throw new Error(
        "Task ID is required",
      );
    }

    return await request(
      `/tasks/${id}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    );
  },

  // ====================================================
  // GET DELETED TASKS
  // ====================================================

  getDeleted: async (
    token,
  ) => {
    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    return await request(
      "/deleted-tasks",
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    );
  },
};

// ======================================================
// CLASS API
// ======================================================

export const classApi = {
  // ====================================================
  // GET ALL CLASSES
  // ====================================================

  getAll: async (
    token,
  ) => {
    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    return await request(
      "/classes",
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    );
  },

  // ====================================================
  // GET CLASS BY ID
  // ====================================================

  getById: async (
    token,
    id,
  ) => {
    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    if (!id) {
      throw new Error(
        "Class ID is required",
      );
    }

    return await request(
      `/classes/${id}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    );
  },

  // ====================================================
  // CREATE CLASS
  // ====================================================

  create: async (
    token,
    name,
    subject,
  ) => {
    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    // ----------------------------------------------
    // CLASS NAME
    // ----------------------------------------------

    if (
      typeof name !==
      "string" ||
      !name.trim()
    ) {
      throw new Error(
        "Class name is required",
      );
    }

    const cleanName =
      name.trim();

    if (cleanName.length < 2) {
      throw new Error(
        "Class name must be at least 2 characters",
      );
    }

    if (
      cleanName.length > 100
    ) {
      throw new Error(
        "Class name cannot exceed 100 characters",
      );
    }

    // ----------------------------------------------
    // SUBJECT
    // ----------------------------------------------

    if (
      typeof subject !==
      "string" ||
      !subject.trim()
    ) {
      throw new Error(
        "Subject is required",
      );
    }

    const cleanSubject =
      subject.trim();

    if (
      cleanSubject.length < 2
    ) {
      throw new Error(
        "Subject must be at least 2 characters",
      );
    }

    if (
      cleanSubject.length > 100
    ) {
      throw new Error(
        "Subject cannot exceed 100 characters",
      );
    }

    // ----------------------------------------------
    // API REQUEST
    // ----------------------------------------------

    const data =
      await request(
        "/classes",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: cleanName,
            subject:
              cleanSubject,
          }),
        },
      );

    return (
      data?.class ||
      data?.data ||
      data
    );
  },

  // ====================================================
  // JOIN CLASS
  // ====================================================

  join: async (
    token,
    classCode,
  ) => {
    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    if (
      typeof classCode !==
      "string" ||
      !classCode.trim()
    ) {
      throw new Error(
        "Class code is required",
      );
    }

    const normalizedCode =
      classCode
        .trim()
        .toUpperCase();

    // 8 uppercase letters/numbers
    if (
      !/^[A-Z0-9]{8}$/.test(
        normalizedCode,
      )
    ) {
      throw new Error(
        "Class code must contain 8 valid characters",
      );
    }

    const data =
      await request(
        "/classes/join",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            classCode:
              normalizedCode,
          }),
        },
      );

    return (
      data?.class ||
      data?.data ||
      data
    );
  },

  // ====================================================
  // LEAVE CLASS
  // ====================================================

  leave: async (
    token,
    id,
  ) => {
    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    if (!id) {
      throw new Error(
        "Class ID is required",
      );
    }

    return await request(
      `/classes/${id}/leave`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    );
  },

  // ====================================================
  // DEACTIVATE CLASS
  // ====================================================

  delete: async (
    token,
    id,
  ) => {
    if (!token) {
      throw new Error(
        "Authentication token is required",
      );
    }

    if (!id) {
      throw new Error(
        "Class ID is required",
      );
    }

    return await request(
      `/classes/${id}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    );
  },
};

// ======================================================
// PARENT API
// ======================================================

export const parentApi = {
  // Parent -> Student
  requestLink: async (token, studentEmail) => {
    if (!token) {
      throw new Error("Authentication token is required");
    }

    if (!studentEmail || !studentEmail.trim()) {
      throw new Error("Student email is required");
    }

    return await request("/parent/request-link", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        studentEmail: studentEmail.trim().toLowerCase(),
      }),
    });
  },

  // Student -> Get pending request
  getLinkRequest: async (token) => {
    if (!token) {
      throw new Error("Authentication token is required");
    }

    return await request("/parent/link-request", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Student -> Accept
  acceptLink: async (token) => {
    if (!token) {
      throw new Error("Authentication token is required");
    }

    return await request("/parent/accept-link", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Student -> Reject
  rejectLink: async (token) => {
    if (!token) {
      throw new Error("Authentication token is required");
    }

    return await request("/parent/reject-link", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Parent -> Get linked child
  getChild: async (token) => {
    if (!token) {
      throw new Error("Authentication token is required");
    }

    return await request("/parent/child", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// ======================================================
// DEFAULT EXPORT
// ======================================================

export default {
  authApi,
  taskApi,
  classApi,
  parentApi,
};