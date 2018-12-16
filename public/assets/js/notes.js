$(document).ready(function () {

  $(document).on("click", "button.delete", deleteNote);

  // This function deletes a todo when the user clicks the delete button
  function deleteNote(event) {
    event.stopPropagation();
    const id = $(this).data("id");
    const artid = $(this).data("artid");
    $.ajax({
      method: "DELETE",
      url: "/api/notes/" + id
    }).then(function (dbDelResult) {
      console.log("Deleted note");
      console.log("Article ID " + dbDelResult._id);
      window.location.reload();
    }).catch(function (err) {
      // If an error occurred, send it to the client
      console.log(err);
    });
  }

});