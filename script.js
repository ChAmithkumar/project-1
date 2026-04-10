const API = "https://blogtube-backend.onrender.com/api";

const authModal = document.getElementById("authModal");
const dashboard = document.getElementById("dashboard");
const videos = document.getElementById("videos");

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

// LOGIN
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

// LOAD VIDEOS
async function load() {
  const res = await fetch(`${API}/video`);
  const data = await res.json();
  const currentUser = JSON.parse(localStorage.getItem("user"));

  videos.innerHTML = "";

  data.forEach(v => {
    videos.innerHTML += `
      <div class="card video-card">

        

        <div style="flex:1;">
          <h3>${v.title}</h3>
          <p>By: ${v.author?.username || "User"}</p>

          <video controls src="http://localhost:5000${v.videoUrl}"></video>

          <p>👍 <span id="likes-${v._id}">${v.likes}</span></p>

          <button onclick="likeVideo('${v._id}')">Like</button>

          <!-- COMMENTS -->
          <div>
            ${(v.comments || []).map(c => `<p>💬 ${c}</p>`).join("")}
          </div>

          <button onclick="editVideo('${v._id}', '${v.title}', '${v.description}')">Edit</button>

          <!--Delete-->
          ${(typeof v.author === "string" ? v.author === currentUser.id : v.author?._id === currentUser.id)
            ? `<button onclick="deleteVideo('${v._id}')">Delete</button>`
            : ""
       }

          <input id="c-${v._id}" placeholder="Write comment">
          <button onclick="addComment('${v._id}')">Post</button>
        </div>
      </div>
    `;
  });
}

// LIKE
async function likeVideo(id) {
  const res = await fetch(`http://localhost:5000/videos/like/${id}`, {
    method: "PUT"
  });

  if (res.ok) {
    const likeElement = document.getElementById(`likes-${id}`);
    likeElement.innerText = parseInt(likeElement.innerText) + 1;
  }
}

// COMMENT
async function addComment(id) {
  const input = document.getElementById(`c-${id}`);
  const text = input.value;

  if (!text) return;

  await fetch(`http://localhost:5000/videos/comment/${id}`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ comment: text })
  });

  input.value = "";
  load();
}


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

  load(); // refresh UI
}

// DELETE
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

// PROFILE
function openProfile() {
  dashboard.style.display = "none";
  document.getElementById("profilePage").style.display = "block";

  const user = JSON.parse(localStorage.getItem("user"));

  document.getElementById("profileName").innerText = user.username;
  document.getElementById("profileEmail").innerText = user.email;

  loadUserVideos(user.id);
}

let allVideos = [];

async function load() {
  const res = await fetch(`${API}/video`);
  const data = await res.json();

  allVideos = data; // ✅ store globally
  renderVideos(data);
}

function renderVideos(data) {
  videos.innerHTML = "";

  const currentUser = JSON.parse(localStorage.getItem("user"));

  data.forEach(v => {
    videos.innerHTML += `
      <div class="video-card">

        <video 
          controls 
          src="http://localhost:5000${v.videoUrl}"
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

            ${(typeof v.author === "string" 
              ? v.author === currentUser.id 
              : v.author?._id === currentUser.id)
              ? `<button onclick="editVideo('${v._id}', \`${v.title}\`, \`${v.description}\`)">✏️ Edit</button>`
              : ""
            }

            ${(typeof v.author === "string" 
              ? v.author === currentUser.id 
              : v.author?._id === currentUser.id)
              ? `<button onclick="deleteVideo('${v._id}')">🗑 Delete</button>`
              : ""
          }
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

async function addView(id) {
  // prevent multiple increments in one session
  if (sessionStorage.getItem("viewed-" + id)) return;

  sessionStorage.setItem("viewed-" + id, true);

  const res = await fetch(`http://localhost:5000/videos/view/${id}`, {
    method: "PUT"
  });

  if (res.ok) {
    const viewEl = document.getElementById(`views-${id}`);
    viewEl.innerText = parseInt(viewEl.innerText) + 1;
  }
}

function searchVideos() {
  const value = document.getElementById("searchInput").value.toLowerCase();

  const filtered = allVideos.filter(v =>
    v.title.toLowerCase().includes(value)
  );

  renderVideos(filtered);
}

// LOAD USER VIDEOS (ONLY ONE VERSION)
function loadUserVideos(userId) {
  fetch(`${API}/video`)
    .then(res => res.json())
    .then(data => {

      const container = document.getElementById("userVideos");
      container.innerHTML = "";

      const myVideos = data.filter(v => {
        if (typeof v.author === "string") {
          return v.author === userId;
        } else {
          return v.author?._id === userId;
        }
      });

      if (myVideos.length === 0) {
        container.innerHTML = "<p>No videos uploaded yet</p>";
        return;
      }

      myVideos.forEach(v => {
        container.innerHTML += `
          <div class="card">
            <h3>${v.title}</h3>
            <video controls src="http://localhost:5000${v.videoUrl}"></video>
          </div>
        `;
      });

    });
}

function closeProfile() {
  document.getElementById("profilePage").style.display = "none";
  dashboard.style.display = "block";
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

// UPLOAD
async function upload() {
  const token = localStorage.getItem("token");

  if (!token) return alert("Login required");

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

// LOGOUT
function logout() {
  localStorage.removeItem("token");
  location.reload();
}