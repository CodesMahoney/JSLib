// Requires Jquery and base.js (also known as custom.js)
function bindListOptionClick() {
    /// <summary>
    /// auto fills an auto-complete box and hidden Id field, with the data attrs from a "list all" modal window link element.
    /// </summary>
    $('.list_option').singleBind("click", function (e) {
        e.preventDefault();
        var $liopt = $(this);
        var root = $(this).data('elemroot');
        var id = $(this).data('id');
        var val = $(this).data('val');

        var $elem_AC = $(root + '_AC');

        $elem_AC.val(val);
        $(root + 'Id').val(id);
        $($liopt.parents('.modal:first')).modal('hide');

        $elem_AC.addClass('highlighted');
        $elem_AC.change();

        setTimeout(function () {
            $elem_AC.removeClass('highlighted');
        }, 2000);
    });
};

$(function () {
    $(".admin-delete").singleBind("click", function () {
        if (confirm("This functionality permentenly deletes a record in the system, and should be used sparingly. If you are unsure if you should delete this record, please contact IS before proceeding. Are you sure you want to permanently delete this record?")) {
            delete_editable();
        }
    });

    if (!$("#admin_buttonbar #save_editable").length > 0) {
        $('#admin_buttonbar').append($("<a href='#' class='btn btn-xs btn-success' id='save_editable'>Save Modified Rows</a>").click(function () {
            save_editable();
        }));
    }

    if (!$("#admin_buttonbar #clear_edits").length > 0) {
        $('#admin_buttonbar').append($("<a href='#' class='btn btn-xs btn-warning' id='clear_edits'>Clear Modified Rows</a>").click(function () {
            location.reload();
        }));
    }

    $(".unique").singleBind("blur change keyup", function () {
        var elem = $(this);
        var obj = {};

        obj.term = elem.val();
        obj.classname = elem.data("class");
        obj.prop = elem.data("prop");

        $.ajax({
            type: "Post",
            url: baseUrl + "unique",
            data: JSON.stringify(obj),
            contentType: "application/json",
            dataType: "json",
            success: function (data) {
                console.log(data);
                if (data === 1) {
                    elem.addClass("avail");
                    elem.removeClass("notavail");
                } else {
                    elem.removeClass("avail");
                    elem.addClass("notavail");
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                handleErrors(xhr, ajaxOptions, thrownError);
            }
        });
    });

    // this does all of the jquery autocomplete stuff
    $(".autocomplete-with-hidden").autocomplete({
        source: function (request, response) {
            var url = $(this.element).data('url');
            var admintype = $(this.element).data("type");
            console.log("ac_term: " + request.term);
            $.getJSON(url, { term: request.term, admintype: admintype }, function (data) {
                response(data);
            });
        },
        select: function (event, ui) {
            $(event.target).next('input[type=hidden]').val(ui.item.id);
        },
        change: function (event, ui) {
            if (!ui.item) {
                $(event.target).val('').next('input[type=hidden]').val('');
            }
        }
    });

    // do an immediate ajax get if a list-all modal window is opened up.
    $('.modal').singleBind('shown.bs.modal', function (e) {
        $(this).find('.modal-body .form-group .form-control').eq(0).focus();

        var mythis = this;
        var target = $(e.relatedTarget).data("url");
        var admintype = $(e.relatedTarget).data("type");

        if (target) {
            $.ajax({
                type: "Get",
                url: target,
                contentType: "application/json",
                dataType: "html",
                data: { admintype: admintype },
                success: function (data) {
                    $(mythis).find('#list_target').html(data);
                    bindListOptionClick();
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    handleErrors(xhr, ajaxOptions, thrownError);
                }
            });
        }
    });

    // super hack... the root of this issue is hard to explain...
    // - finds a nested modal and kicks it out and adds it after.
    var innermodal = $('#Add_Item').find(".modal").eq(0);
    $('#Add_Item').after(innermodal);
})