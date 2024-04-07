/* global $ */
$(document).ready(function () {
  const amenities = {};
  const states = {};
  const cities = {};

  // check api status
  $.get('http://0.0.0.0:5001/api/v1/status/', (data, status) => {
    if (status === 'success' && data.status === 'OK') {
      $('div#api_status').addClass('available');
    }
  });

  $('input[type=checkbox]').change(function () {
    const id = $(this).attr('data-id');
    const name = $(this).attr('data-name');

    if (this.checked) {
      if ($(this).attr('id') === 'state_filter') {
        states[id] = name;
        $(this)
          .parent()
          .next()
          .find('input[id=city_filter]')
          .each(function () {
            $(this).prop('checked', true);
            cities[$(this).attr('data-id')] = $(this).attr('data-name');
          });
      } else if ($(this).attr('id') === 'city_filter') {
        cities[id] = name;
      } else {
        amenities[id] = name;
      }
    } else {
      if ($(this).attr('id') === 'state_filter') {
        $(this)
          .parent()
          .next()
          .find('input[id=city_filter]')
          .each(function () {
            $(this).prop('checked', false);
            delete cities[$(this).attr('data-id')];
          });
        delete states[id];
      } else if ($(this).attr('id') === 'city_filter') {
        delete cities[id];
      } else {
        delete amenities[id];
      }
    }

    updateAmenitiesText();
    updateStatesText();
  });

  filterPlaces(amenities);

  $('.filters button').click((_evt) => {
    filterPlaces(amenities);
  });

  // retrieve the data based on selected amenities
  function filterPlaces (amenities) {
    try {
      const query = {
        states: Object.keys(states),
        cities: Object.keys(cities),
        amenities: Object.keys(amenities)
      };

      $.ajax({
        type: 'POST',
        url: 'http://0.0.0.0:5001/api/v1/places_search',
        data: JSON.stringify(query),
        headers: { 'content-type': 'application/json' },
        success: (data) => {
          const articles = data.map(
            (place) =>
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
        `
          );
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
    //    const amenityNames = amenities.map((amenity) => Object.values(amenity)[0]);
    const text = Object.values(amenities).join(', ');

    if (Object.keys(amenities).length === 0) {
      $('.amenities h4').html('&nbsp;');
    } else {
      $('.amenities h4').text(
        text.length > 60 ? `${text.substr(0, 60)}...` : text
      );
      $('.amenities h4').css('white-space', 'nowrap');
    }
  }

  // Update states tag lines
  function updateStatesText () {
    const locations = [];

    for (const cityId in cities) {
      const cityName = cities[cityId];

      $.get(`http://0.0.0.0:5001/api/v1/cities/${cityId}/`, (cityData) => {
        $.get(
          `http://0.0.0.0:5001/api/v1/states/${cityData.state_id}`,
          (stateData) => {
            const stateName = stateData.name;

            // Check if the state is already in the locations array
            const stateIndex = locations.findIndex((location) =>
              location.startsWith(`<strong>${stateName}</strong>`)
            );
            if (stateIndex > -1) {
              // If the state is already in the array, add the city to it
              locations[stateIndex] += `, ${cityName}`;
            } else {
              // If the state is not in the array, add it with the city
              locations.push(`<strong>${stateName}</strong>: ${cityName}`);
            }
          }
        );
      });
    }

    for (const stateId in states) {
      const stateName = states[stateId];

      // If the state is not in the array, add it
      if (
        !locations.some((location) =>
          location.startsWith(`<strong>${stateName}</strong>`)
        )
      ) {
        locations.push(`<strong>${stateName}</strong>`);
      }
    }

    // Wait for all AJAX requests to complete before updating the template
    $(document).ajaxStop(function () {
      const text = locations.join(', ');

      if (locations.length === 0) {
        $('.locations h4').html(' ');
      } else {
        $('.locations h4').html(
          text.length > 60 ? `${text.substr(0, 60)}...` : text
        );
        $('.locations h4').css('white-space', 'nowrap');
      }
    });
  }
});
