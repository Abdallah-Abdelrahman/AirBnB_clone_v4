/* global $ */
$(document).ready(function () {
  const amenities = [];

  // check api status
  $.get('http://0.0.0.0:5001/api/v1/status/', (data, status) => {
    if (status === 'success' && data.status === 'OK') {
      $('div#api_status').addClass('available');
    }
  });

  $('input[type=checkbox]').change(function () {
    const amenityId = $(this).attr('data-id');
    const amenityName = $(this).attr('data-name');

    if (this.checked) {
      amenities.push({ [amenityId]: amenityName });
    } else {
      amenities.splice(
        amenities.findIndex((amenity) => Object.keys(amenity)[0] === amenityId),
        1
      );
    }

    updateAmenitiesText();
  });

  filterPlaces(amenities);

  $('.filters button').click(_evt => {
    filterPlaces(amenities);
  });

  // retrieve the data based on selected amenities
  function filterPlaces (amenities) {
    try {
      const query =
        amenities.length > 0 ? { amenities: amenities.map(amnt => Object.keys(amnt)[0]) } : {};

      $.ajax({
        type: 'POST',
        url: 'http://0.0.0.0:5001/api/v1/places_search',
        data: JSON.stringify(query),
        headers: { 'content-type': 'application/json' },
        success: (data) => {
          const articles = data.map(place => (
              `<article>
           <div class="title_box">
            <h2>${place.name}</h2>
            <div class="price_by_night">$${place.price_by_night}</div>
          </div>
          <div class="information">
            <div class="max_guest">${place.max_guest} Guest${
              place.max_guest > 1 ? 's' : ''
            }</div>
            <div class="number_rooms">${place.number_rooms} Bedroom${
              place.number_rooms > 1 ? 's' : ''
            }</div>
            <div class="number_bathrooms">${place.number_bathrooms} Bathroom${
              place.number_bathrooms > 1 ? 's' : ''
            }</div>
          </div>
          <div class="user">
            <b>Owner:</b> ${place.first_name} ${place.last_name}
          </div>
          <div class="description">
            ${place.description}
          </div>
        </article>
        `));
          $('.places').html(articles);
        }
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  // Update amenities tag lines
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
