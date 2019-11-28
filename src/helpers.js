const APPLICATION_DEFAULT_STATE = {
  users: {}
}


export function api31Call(method, path, queryParams, payload) {
  let url = '/api/internal/core/3.1' + [path, queryParams].join('?')
  let obj = { 
    method: method,
    headers: {
      "x-csrf-token": readCookie('CSRF-TOKEN')
    },
    body: JSON.stringify(payload)
  }
  return fetch(url, obj).then(
    response => response.json())
}

export function api31CallSqlText(method, path, queryParams, payload) {
  let url = '/api/internal/core/3.1' + [path, queryParams].join('?')
  let obj = { 
    method: method,
    headers: {
      "x-csrf-token": readCookie('CSRF-TOKEN')
    },
    body: JSON.stringify(payload)
  }
  return fetch(url, obj).then(
    response => response.text())
}
  
function readCookie(cookieName) {
  var re = new RegExp('[; ]'+cookieName+'=([^\\s;]*)');
  var sMatch = (' '+document.cookie).match(re);
  if (cookieName && sMatch) return unescape(sMatch[1]);
  return '';
}

export async function getCohortSpace () {
  var user = await api31Call('GET','/user')
  var personal_space = await api31Call('GET','/spaces/search','parent_id='+user.personal_space_id)
  
  var findLast = require('lodash/findLast');
  
  var cc_space = findLast(personal_space, (o) => {return o.name == '_cohort_creator' })

  if (cc_space && cc_space.id) {
    return cc_space.id
  } else {
    var new_space = await api31Call('POST','/spaces','',{
      parent_id: user.personal_space_id,
      name: '_cohort_creator'
    })
    return new_space.id
  }
}

export function setApplicationContext (context_object) {
  let url = `/api/internal/applications/${window.lookerMetadata.app.id}`

  let obj = { 
    method: 'PUT',
    headers: {
      "x-csrf-token": readCookie('CSRF-TOKEN')
    },
    body: JSON.stringify({ context: JSON.stringify(context_object)})
  }

  return fetch(url, obj).then(
    response => response.json())
}

export function getApplicationContext () {
  let url = `/api/internal/applications/${window.lookerMetadata.app.id}`

  let obj = { 
    method: 'GET',
    headers: {
      "x-csrf-token": readCookie('CSRF-TOKEN')
    }
  }

  return new Promise((resolve, reject)=> {
    fetch(url, obj)
    .then(response => {
      return response.json().then(data => {
          resolve (JSON.parse(data.context || JSON.stringify(APPLICATION_DEFAULT_STATE)))
      });
    })
  }) 
}

export function getFile(project, view_file) {
  let url = '/api/internal/projects/'+project+'/files/'+view_file
  let obj = { 
    method: 'GET',
    headers: {
      "x-csrf-token": readCookie('CSRF-TOKEN')
    }
  }
  return fetch(url, obj).then(
    response => response.json())
}

export async function getSQL(object) {
  let url = '/api/internal/core/3.1/queries/run/sql';
  let obj = { 
    method: 'POST',
    headers: {
      "x-csrf-token": readCookie('CSRF-TOKEN')
    },
    body: JSON.stringify(Object.assign(object,{limit: -1}))
  }
  var sql = await fetch(url, obj)
  var sql_text = await sql.text();
  return new Promise((resolve,reject) => {
    resolve(sql_text.replace('LIMIT 100000',''))
  })
}

export function sqlText (dialect, view, look_id, new_query) {
  if (dialect === 'redshift') { return redshift(view, look_id, new_query) }
  // more dialects here
  return ''
}

function redshift (view, look_id, new_query) {
  return `
  INSERT INTO $\{${view}.SQL_TABLE_NAME} 
    (join_key,cohort_id,looker_user_id,created_at)
  (
    SELECT * FROM (
      ${new_query}
    )
    CROSS JOIN ( 
      SELECT 
        ${look_id} as cohort_id
      , {{ _user_attributes['id'] | replace: '.0', '' }} as looker_user_id
      , getdate() as created_at 
    ) as extras
  )
  `
}

export function fnum(x) {
	if(isNaN(x)) return x;

	if(x < 9999) {
		return x;
	}

	if(x < 1000000) {
		return Math.round(x/1000) + "K";
	}
	if( x < 10000000) {
		return (x/1000000).toFixed(2) + "M";
	}

	if(x < 1000000000) {
		return Math.round((x/1000000)) + "M";
	}

	if(x < 1000000000000) {
		return Math.round((x/1000000000)) + "B";
	}

	return "1T+";
}