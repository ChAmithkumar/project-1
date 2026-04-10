const API = "https://project-1-2l4m.onrender.com/api";
const BASE = "https://project-1-2l4m.onrender.com";

const authModal = document.getElementById("authModal");
const dashboard = document.getElementById("dashboard");
const videos = document.getElementById("videos");

let allVideos = [];

// ================= INIT =================
window.onload = () => {
  const token = localStorage.getItem("token");

  if (token) {
    authModal.style.display = "none";
    dashboard.style.display = "block";
    document.getElementById("profilePage").style.display = "none";
    load();
  } else {
    authModal.style.display = "flex";
    dashboard.style.display = "none";
  }
};

// ================= SIGNUP =================
async function signup() {
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        username: u.value,
        email: e.value,
        password: p.value
      })
    });

    const data = await res.json();
    console.log("SIGNUP:", data);

    if (res.ok) {
      alert("Signup successful! Please login.");
    } else {
      alert(data.msg || "Signup failed");
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

// ================= LOGIN =================
async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      email: le.value,
      password: lp.value
    })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    location.reload();
  } else {
    alert(data.msg || "Login failed");
  }
}

// ================= LOAD =================
async function load() {
  const res = await fetch(`${API}/video`);
  const data = await res.json();

  allVideos = data;
  renderVideos(data);
}

// ================= RENDER =================
function renderVideos(data) {
  videos.innerHTML = "";

  const currentUser = JSON.parse(localStorage.getItem("user"));

  data.forEach(v => {
    const isOwner = currentUser &&
      (typeof v.author === "string"
        ? v.author === currentUser.id
        : v.author?._id === currentUser.id);

    videos.innerHTML += `
      <div class="video-card">

        <video 
          controls 
          src="${BASE}${v.videoUrl}"
          onplay="addView('${v._id}')"
        ></video>

        <div class="video-content">
          <h3>${v.title}</h3>
          <p>By ${v.author?.username || "User"}</p>

          <p>
            👍 <span id="likes-${v._id}">${v.likes}</span> |
            👁 <span id="views-${v._id}">${v.views || 0}</span>
          </p>

          <div class="video-actions">
            <button onclick="likeVideo('${v._id}')">👍 Like</button>

            ${isOwner ? `
              <button onclick="editVideo('${v._id}', \`${v.title}\`, \`${v.description}\`)">✏️ Edit</button>
              <button onclick="deleteVideo('${v._id}')">🗑 Delete</button>
            ` : ""}
          </div>

          <input id="c-${v._id}" placeholder="Write comment">
          <button onclick="addComment('${v._id}')">Post</button>

          <div>
            ${(v.comments || []).map(c => `<p>💬 ${c}</p>`).join("")}
          </div>
        </div>
      </div>
    `;
  });
}


async function upload() {
  const token = localStorage.getItem("token");

  if (!token) return alert("Login required");

  if (!videoFile.files[0]) {
    return alert("Please select a video");
  }

  const formData = new FormData();
  formData.append("title", t.value);
  formData.append("description", d.value);
  formData.append("video", videoFile.files[0]);

  try {
    const res = await fetch(`${API}/video`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token
      },
      body: formData
    });

    const data = await res.json();

    console.log("UPLOAD RESPONSE:", data); // 👈 ADD THIS

    if (res.ok) {
      alert("Uploaded successfully");
      load();
    } else {
      alert(data.msg || "Upload failed");
    }

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    alert("Server error");
  }
}



// ================= LIKE =================
async function likeVideo(id) {
  const res = await fetch(`${BASE}/videos/like/${id}`, {
    method: "PUT"
  });

  if (res.ok) {
    const el = document.getElementById(`likes-${id}`);
    el.innerText = parseInt(el.innerText) + 1;
  }
}

// ================= COMMENT =================
async function addComment(id) {
  const input = document.getElementById(`c-${id}`);
  const text = input.value;

  if (!text) return;

  await fetch(`${BASE}/videos/comment/${id}`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ comment: text })
  });

  input.value = "";
  load();
}

// ================= EDIT =================
async function editVideo(id, oldTitle, oldDesc) {
  const newTitle = prompt("Edit title:", oldTitle);
  const newDesc = prompt("Edit description:", oldDesc);

  if (!newTitle || !newDesc) return;

  const token = localStorage.getItem("token");

  await fetch(`${API}/video/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      title: newTitle,
      description: newDesc
    })
  });

  load();
}

// ================= DELETE =================
async function deleteVideo(id) {
  const token = localStorage.getItem("token");

  if (!confirm("Delete this video?")) return;

  await fetch(`${API}/video/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + token
    }
  });

  load();
}

// ================= VIEW =================
async function addView(id) {
  if (sessionStorage.getItem("viewed-" + id)) return;

  sessionStorage.setItem("viewed-" + id, true);

  const res = await fetch(`${BASE}/videos/view/${id}`, {
    method: "PUT"
  });

  if (res.ok) {
    const el = document.getElementById(`views-${id}`);
    el.innerText = parseInt(el.innerText) + 1;
  }
}

// ================= SEARCH =================
function searchVideos() {
  const value = document.getElementById("searchInput").value.toLowerCase();

  const filtered = allVideos.filter(v =>
    v.title.toLowerCase().includes(value)
  );

  renderVideos(filtered);
}

// ================= PROFILE =================
function openProfile() {
  dashboard.style.display = "none";
  document.getElementById("profilePage").style.display = "block";

  const user = JSON.parse(localStorage.getItem("user"));

  document.getElementById("profileName").innerText = user.username;
  document.getElementById("profileEmail").innerText = user.email;

  loadUserVideos(user.id);
}

function loadUserVideos(userId) {
  fetch(`${API}/video`)
    .then(res => res.json())
    .then(data => {

      const container = document.getElementById("userVideos");
      container.innerHTML = "";

      const myVideos = data.filter(v =>
        typeof v.author === "string"
          ? v.author === userId
          : v.author?._id === userId
      );

      if (!myVideos.length) {
        container.innerHTML = "<p>No videos uploaded yet</p>";
        return;
      }

      myVideos.forEach(v => {
        container.innerHTML += `
          <div class="card">
            <h3>${v.title}</h3>
            <video controls src="${BASE}${v.videoUrl}"></video>
          </div>
        `;
      });

    });
}

function closeProfile() {
  document.getElementById("profilePage").style.display = "none";
  dashboard.style.display = "block";
}

// ================= UPLOAD =================
async function upload() {
  const token = localStorage.getItem("token");

  if (!token) return alert("Login required");
  if (!videoFile.files[0]) return alert("Select a video");

  const formData = new FormData();
  formData.append("title", t.value);
  formData.append("description", d.value);
  formData.append("video", videoFile.files[0]);

  try {
    const res = await fetch(`${API}/video`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token
      },
      body: formData
    });

    const data = await res.json();
    console.log("UPLOAD:", data);

    if (res.ok) {
      alert("Uploaded successfully");
      load();
    } else {
      alert(data.msg || "Upload failed");
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

// PREVIEW
function previewThumb(e) {
  document.getElementById("thumbPreview").src =
    URL.createObjectURL(e.target.files[0]);
}

function previewVideo(e) {
  document.getElementById("videoPreview").src =
    URL.createObjectURL(e.target.files[0]);
}

// ================= LOGOUT =================
function logout() {
  localStorage.removeItem("token");
  location.reload();
}
