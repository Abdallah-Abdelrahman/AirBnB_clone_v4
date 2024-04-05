/* global $ */
$(document).ready(function () {
  const amenities = [];

  $('input[type=checkbox]').change(function () {
    const amenityId = $(this).attr('data-id');
    const amenityName = $(this).attr('data-name');

    if (this.checked) {
      amenities.push({ [amenityId]: amenityName });
    } else {
      amenities.pop(
        amenities.findIndex((amenity) => Object.keys(amenity)[0] === amenityId),
        1
      );
    }

    updateAmenitiesText();
  });

  // ajax request to retrieve the status
  $.get('http://0.0.0.0:5001/api/v1/status/', (data, status) => {
    if (status === 'success' && data.status === 'OK') {
      console.log({ data });
      $('div#api_status').addClass('available');
    }
  });

  // ajax request to retrieve the places
  $.ajax({
    type: 'POST',
    url: 'http://0.0.0.0:5001/api/v1/places_search',
    data: JSON.stringify({}),
    headers: { 'content-type': 'application/json' },
    success: (data) => {
      for (let i = 0; i < data.length; i++) {
        $('.places').append(
          `<article>
           <div class="title_box">
            <h2>${data[i].name}</h2>
            <div class="price_by_night">$${data[i].price_by_night}</div>
          </div>
          <div class="information">
            <div class="max_guest">${data[i].max_guest} Guest${
              data[i].max_guest > 1 ? 's' : ''
            }</div>
            <div class="number_rooms">${data[i].number_rooms} Bedroom${
              data[i].number_rooms > 1 ? 's' : ''
            }</div>
            <div class="number_bathrooms">${data[i].number_bathrooms} Bathroom${
              data[i].number_bathrooms > 1 ? 's' : ''
            }</div>
          </div>
          <div class="user">
            <b>Owner:</b> ${data[i].first_name} ${data[i].last_name}
          </div>
          <div class="description">
            ${data[i].description}
          </div>
        </article>
        `
        );
      }
    }
  });

  function updateAmenitiesText () {
    const amenityNames = amenities.map((amenity) => Object.values(amenity)[0]);
    const text = amenityNames.join(', ');

    if (amenityNames.length === 0) {
      $('.amenities h4').html('&nbsp;');
    } else {
      $('.amenities h4').text(
        text.length > 60 ? `${text.substr(0, 60)}...` : text
      );
      $('.amenities h4').css('white-space', 'nowrap');
    }
  }
});
