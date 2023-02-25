const setPreviewImage = (evt, id) => {
  const file = evt.target.files[0];
  const reader = new FileReader();
  const imageElement = document.getElementById(id);
  reader.onloadend = () => {
    imageElement.src = reader.result;
    imageElement.classList.remove("d-none");
  };

  if (file.type.match(/image.*/)) {
    reader.readAsDataURL(file);
  } else {
    imageElement.classList.add("d-none");
    alert("File is not an image");
  }
};

//-------admin--------------------------------------------------------//

async function setListUsers() {

  var typeUser = document.getElementById("show-department-manager").value;
  const typeUserClass = ["", "", "activity-activated", "activity-complete", "activity-waiting", "activity-reject"]
  var html = ``;

  if (typeUser === "1") document.location.reload(true);
  else {

    //------calll-api---------------//

    const res = await fetch(`/admin/users/${typeUser}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    console.log("response data ", data);////////////

    //----------fetch data----------//

    data.Users.map((val, _id) => {
      html += `<div class="management-item" onclick="getPersonal(this)">
      <div class="row" style="display: block">
      <span class="dot-person ${typeUserClass[typeUser]}"></span>
          <span>
              <a class="person-label" href="/admin/detailUser/${val.id}">${val.fullname}</a>
              <div class="person-box">
                  <a class="person">${val.status}</a>
                  <a class="person-right">${val.created_date}</a>
              </div>
          </span>
      </div>
  </div>`
    })
  }

  document.getElementById("list-employee").innerHTML = html;
}

function openModal(status, id) {
  document.querySelector('.modal-group').innerHTML = `<div class="modal fade" id="confirmModal" tabindex="-1" role="dialog" aria-labelledby="confirmModal" aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="confirmModal">Modal confirm</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        Xác nhận thao tác ?
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Hủy</button>
        <button type="button" class="btn btn-primary" onclick="updateStatus(\'${status}\', ${id})">Xác nhận</button>
      </div>
    </div>
  </div>
</div>`
  $('#confirmModal').modal('show');
}

async function updateStatus(status, id) {
  console.log(status, id);
  const res = await fetch(`/admin/detailUser/update-status`, {
    method: 'POST',
    body: JSON.stringify({ 'status': status, 'userID': id }),
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  console.log("response data ", data);////////////
  if (data.status  === "success" ) document.location.reload(true);
}
async function updateTransaction(status, id) {
  console.log(status, id);
  const res = await fetch(`/index/transaction/update-status`, {
    method: 'POST',
    body: JSON.stringify({ 'status': status, 'id': id }),
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  console.log("response data ", data);////////////
  if (data.status  === "success" ) document.location.reload(true);
}
