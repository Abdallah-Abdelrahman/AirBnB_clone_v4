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

  const [handler, { cities_, amnts_ }] = (function IIFE () {
    const cities_ = {};
    const amnts_ = {};

    function actionHandler (action) {
      return function evtHandler (evt) {
        const id = evt.target.getAttribute('data-id');
        const name = evt.target.getAttribute('data-name');
        const isChecked = evt.target.checked;
        let i = 0;

        switch (action) {
          case 'state':
            const ctItems = evt.target.parentElement.nextElementSibling;
            if (isChecked) {
              cities_[name] = [];

              // Make all cities' boxes related to `this` state checked
              [...ctItems.children].forEach(li => {
                const ct_input = li.children[0];
                ct_input.checked = true;
                cities_[name].push({ [ct_input.getAttribute('data-id')]: ct_input.getAttribute('data-name') });
              });

              updateRenderedUI(cities_, 'locations', ([st, cts]) => {
                if (cts.length == 0) return '';
                const ui = `<strong>${st}: </strong>`
                  .concat(cts.map(c => Object.values(c)[0])
                    .join(', '));
                return ui.length > 30 ? `${ui.substring(0, 30)}...` : ui;
              });
              return;
            }

            // when unchecked, undo all
            cities_[name] = [];
            updateRenderedUI(cities_, 'locations', ([st, cts]) => {
              if (cts.length == 0) return '';
              return `<strong>${st}: </strong>`
                .concat(cts.map(c => Object.values(c)[0])
                  .join(', '));
            });
            [...ctItems.children].forEach(li => li.children[0].checked = false);
            break;

          case 'amnt':
            if (isChecked) {
              amnts_[id] = name;
              updateRenderedUI(amnts_, 'amenities',
                ([_, name_], i_, thisArr) => {
                  const ui = thisArr.map(el => el[1]).join();
                  const rendered = i_ === thisArr.length - 1
                    ? name_
                    : name_ + ', ';
                  const h4 = document.querySelector('.amenities h4');
                  const content = h4.textContent;
                  if (ui.length > 50) {
                    h4.textContent = '';
                  }

                  return ui.length > 50
                    ? (i-- >= 0
                        ? content.slice(0, content.length - 3) + '...'
                        : content)
                    : rendered;
                });
              return;
            }

            // remove amenity and udpate ui accordingly
            delete amnts_[id];
            updateRenderedUI(amnts_, 'amenities',
              ([_, name_], i_, thisArr) => {
                const ui = thisArr.map(el => el[1]).join();
                const rendered = i_ === thisArr.length - 1
                  ? name_
                  : name_ + ', ';
                const h4 = document.querySelector('.amenities h4');
                const content = h4.textContent;
                if (ui.length > 50) {
                  h4.textContent = '';
                }

                return ui.length > 50
                  ? (i-- >= 0
                      ? content.slice(0, content.length - 3) + '...'
                      : content)
                  : rendered;
              });
            break;

          case 'city':
            let checkCounter = 0;
            const ul = evt.target.parentElement.parentElement;
            const state_input = ul.previousElementSibling.children[0];
            const state_name = state_input.getAttribute('data-name');

            // Determine the number of checked cities' boxes pair state
            [...ul.children].forEach(li => li.children[0].checked && checkCounter++);

            if (checkCounter == ul.children.length) {
              // all checked
              state_input.indeterminate = false;
              state_input.checked = true;
            } else if (checkCounter === 0) {
              state_input.indeterminate = false;
              state_input.checked = false;
            } else {
              state_input.indeterminate = true;
              state_input.checked = false;
            }

            if (!isChecked) {
              // Remove
              cities_[state_name].splice(cities_[state_name].findIndex(c =>
                (Object.keys(c)[0] === id)), 1);
              updateRenderedUI(cities_, 'locations', ([st, cts]) => {
                if (cts.length == 0) return '';
                const ui = `<strong>${st}: </strong>`
                  .concat(cts.map(c => Object.values(c)[0])
                    .join(', '));
                return ui.length > 30 ? `${ui.substring(0, 30)}...` : ui;
              });
              return;
            }

            if (!(state_name in cities_)) cities_[state_name] = [];

            cities_[state_name].push({ [id]: name });

            updateRenderedUI(cities_, 'locations', ([st, cts]) => {
              if (cts.length == 0) return '';
              const ui = `<strong>${st}: </strong>`
                .concat(cts.map(c => Object.values(c)[0])
                  .join(', '));
              return ui.length > 30 ? `${ui.substring(0, 30)}...` : ui;
            });

            break;
        }
      };
    }
    return [actionHandler, { cities_, amnts_ }];
  }());

  /**
   * utils to update the rendered text on states heading based on the selected check boxes
   * @param {Array<{[k:string]: string}>} cities
   * @param {string} clsName param
   * @param {function} cb
   * @returns
   */
  function updateRenderedUI (cities, clsName, cb = () => {}) {
    html = Object.entries(cities)
      .map(cb);

    $(`.${clsName} h4`).html(html);
  }

  $('#state_filter[type=checkbox]').change(handler('state'));
  $('#city_filter[type=checkbox]').change(handler('city'));
  $('.amenities input[type=checkbox]').change(handler('amnt'));

  filterPlaces({
    cities: Object.keys(cities_).map(st_name => cities_[st_name].map(cty => Object.keys(cty)[0])),
    amenities: Object.keys(amnts_)
  });

  $('.filters button').click((_evt) => {
    // console.log({ cities_, amnts_ });
    filterPlaces({
      cities: Object.keys(cities_)
        .map(st_name => cities_[st_name]
          .map(cty => Object.keys(cty)[0]))
        .reduce((acc, el) => acc.concat(el), []),
      amenities: Object.keys(amnts_)
    });
  });

  function filterPlaces (query) {
    // console.log({ cities, amenities });
    try {
      $('#loadingSpinner').show();

      $.ajax({
        type: 'POST',
        url: 'http://0.0.0.0:5001/api/v1/places_search',
        data: JSON.stringify(query),
        headers: { 'content-type': 'application/json' },
        success: (data) => {
          const placePromises = data.map((place) => {
            return new Promise((resolve) => {
              $.get(
                `http://0.0.0.0:5001/api/v1/users/${place.user_id}`,
                (userData) => {
                  const article = `
                <article>
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
                    <div class="number_bathrooms">${
                      place.number_bathrooms
                    } Bathroom${place.number_bathrooms > 1 ? 's' : ''}</div>
                  </div>
                  <div class="user">
                    <b>Owner:</b> ${userData.first_name} ${userData.last_name}
                  </div>
                  <div class="description">
                    ${place.description}
                  </div>
                  <div class="reviews" style="margin-top: 40px;">
                    <h2 style="font-size: 16px; border-bottom: 1px solid #DDDDDD;">Reviews<span class="toggle_reviews" style="float: right;" data-place-id="${
                      place.id
                    }">show</span></h2>
                    <ul class="review_list" style="list-style: none;"></ul>
                  </div>
                </article>
              `;

                  resolve(article);
                }
              );
            });
          });

          Promise.all(placePromises).then((articles) => {
            $('.places').empty().append(articles);
          });
          $('#loadingSpinner').hide();
        },
        error: () => {
          $('#loadingSpinner').hide();
        }
      });
    } catch (err) {
      // console.error(err);
      throw err;
    }
  }

  $(document).on('click', '.toggle_reviews', function () {
    const placeId = $(this).data('place-id');
    const reviewList = $(this).closest('.reviews').find('.review_list');

    if ($(this).text() === 'show') {
      // Fetch and display reviews
      $.get(
        `http://0.0.0.0:5001/api/v1/places/${placeId}/reviews`,
        (reviewsData) => {
          const reviewPromises = reviewsData.map((review) => {
            return new Promise((resolve) => {
              $.get(
                `http://0.0.0.0:5001/api/v1/users/${review.user_id}`,
                (userData) => {
                  resolve(`
              <li>
                <h3 style="font-size: 14px;">From ${userData.first_name} ${
                  userData.last_name
                } on ${new Date(review.created_at).toLocaleDateString()}</h3>
                <p style="font-size: 12px;">${review.text}</p>
              </li>
            `);
                }
              );
            });
          });

          Promise.all(reviewPromises).then((reviews) => {
            reviewList.html(reviews.join(''));

            // Change the text to "hide"
            $(this).text('hide');
          });
        }
      );
    } else {
      // Remove all Review elements from the DOM
      reviewList.empty();

      // Change the text to "show"
      $(this).text('show');
    }
  });
});
