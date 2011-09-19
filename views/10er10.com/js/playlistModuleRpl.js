$(document).one("bootstrap:playlist",function() {

	var module = new d10.fn.playlistModule("rpl",{},{});
	
	var loadPlm = function (id) {
		debug("playlistModuleRpl:callback empty()");
		d10.playlist.empty();
		d10.playlist.loadDriver("rpl",{},{rpl: id},function(err,resp) {
			if ( err )	{
				debug("playlistModuleRpl:loadDriver error",err);
				return ;
			}
			debug("playlistModuleRpl:callback append()");
			d10.playlist.append(resp);

			debug("playlistModuleRpl:callback setDriver()",this);
			d10.playlist.setDriver(this);
		});
	};

	var loadOverlay = function(e) {
// 		var elem = $('<div class="hoverbox overlay"><div class="part">Charger...</div></div>');
		playlists = d10.user.get_playlists();
		if ( !playlists.length ) {
			return false;
		}
// 		for ( var index in playlists ) {
// 			var tt = $('<div class="clickable"></div>');
// 			tt.attr("name",playlists[index]._id).html(playlists[index].name);
// 			elem.append(tt);
// 		}
		elem = $( d10.mustacheView("hoverbox.playlist.rpl.container",{rpl: playlists}) );

		elem.css({'visibility':'hidden','top':0,'left':0}).appendTo($('body'));
		var height = elem.outerHeight(false);
		var width = elem.outerWidth(false);
		var wwidth = $(window).width();
		var left = e.pageX - width + 10;
		var top= e.pageY - height + 10;
		if ( top < 0 ) top = 0;
		
		elem.hide()
		.css ( {
			'top': top,
			'left' : left,
			'visibility':''
		})
		.find('.clickable')
		.click(function() {
			loadPlm($(this).attr('name'));
			$(this).closest('.overlay').ovlay().close();
		});
		elem.ovlay({"onClose":function() {this.getOverlay().remove();} });
			
	};
	d10.playlist.container().find("div.manager button[name=load]").bind("click",loadOverlay);










	var handleSaveClick = function () {
		
		d10.playlist.container().find("div.manager").slideUp("fast");
		d10.playlist.container().find("div.saveplaylist").slideDown("fast");
		
		d10.playlist.container().find("div.saveplaylist input[type=text]").val('').focus(function() {
			if ( $(this).val() == $(this).attr('defaultvalue') ) {
				$(this).val('');
			}
		})
		.blur(function() {
			if ( $(this).val() == '' ) {
				$(this).val($(this).attr('defaultvalue'));
			}
		}).get(0).focus();
	};

	d10.playlist.container().find(".saveplaylist input").keypress(function(e) {
		if ( e.keyCode == 13 ) { d10.playlist.container().find(".saveplaylist button").click(); }
	});
	
	d10.playlist.container().find(".saveplaylist span.link").click(function() {
		d10.playlist.container().find(".saveplaylist").slideUp('fast');
		d10.playlist.container().find(".manager").slideDown('fast');
	});
	
	d10.playlist.container().find(".saveplaylist button").click(function() {
		var container = d10.playlist.container().find('.saveplaylist');
		if ( !$('input[type=text]',container).val().length ||
			$('input[type=text]',container).val() == $('input[type=text]',container).attr('defaultvalue') ) {
			$('span.link',container).trigger('click');
			return ;
		}
		container.slideUp("fast");
		if ( d10.user.playlist_exists($('input[type=text]',container).val()) )  {
			d10.playlist.container().find(".updateplaylist").slideDown("fast");
		} else {
			recordRpl($('input[type=text]',container).val());
		}
	});

	var recordRpl = function (name)  {
// 		d10.playlist.container().find('.playlisttitle > span').text(name);
		d10.my.plmanager.create_playlist(name, {
				songs: d10.playlist.allIds(),
				success: function(resp) {
					debug("playlistModuleRpl:recordRpl:success resp: ",resp);
    			    $('aside .manager').slideDown();
    			    d10.playlist.loadDriver("rpl",{},{rpldoc: resp},function() {
    					debug("playlistModuleRpl:recordRpl:success setDriver: ",this);
						d10.playlist.setDriver(this);
					});
				},
				error: function() {
			      $('aside .manager').slideDown();		
				}
			}
		);
	};

	d10.playlist.container().find(".updateplaylist button").click(function() {
		d10.playlist.container().find(".updateplaylist").slideUp("fast");
		var pl = d10.user.get_playlists();
		var name = d10.playlist.container().find('.saveplaylist input[type=text]').val();
		for ( var index in pl ) {
			if ( pl[index].name == name ) {
				updateRpl(name,pl[index]._id);
				return false;
			}
		}
		d10.playlist.container().find(".manager").slideDown('fast');
		return false;
	});

	d10.playlist.container().find('.updateplaylist span.link').click(function(){
		d10.playlist.container().find(".updateplaylist").slideUp("fast");
		d10.playlist.container().find(".saveplaylist").slideDown("fast");
	});

	var updateRpl = function (name,id)  {
		d10.playlist.title(name);
		d10.my.plmanager.replace_playlist(id, d10.playlist.allIds(),{
			success: function(resp) {
   			    $('aside .manager').slideDown();
				d10.playlist.loadDriver("rpl",{},{rpldoc: resp.data.playlist},function() {
					d10.playlist.setDriver(this);
				});
			}
		});
  }


	d10.playlist.container().find("div.manager button[name=save]").click(handleSaveClick);





	//listen changes from plm module to know if we are still in sync
	
	$(document).bind("rplDropSuccess",function(e,data) {
		if ( !module.isEnabled() )	return ;
		if ( d10.playlist.driver() && d10.playlist.driver().playlistId ) {
			var id = d10.playlist.driver().playlistId();
			if ( id && id.substr(0,2) == "pl" && id == data._id ) {
				d10.playlist.loadDriver ("default",{}, {}, function() {d10.playlist.setDriver(this);} );
					debug("playlistModuleRpl setting default driver");
					
			}
		}
	});




	d10.playlist.modules[module.name] = module;

});

