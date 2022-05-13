function addToCart(proId){
    $.ajax({
        url:'/add-to-cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $("#cart-count").html(count)
            }         
        }
    })
}

function removeCart(proId){
    $.ajax({
        url:'/remove-cart/'+proId,
        method:'get',
        success:(response)=>{
        }
    })
}


function addToWhish(proId){
    
    $.ajax({
        url:'/add-to-whish/'+proId,
        method:'get',
        success:(response)=>{
            if(response){
                //window.location.href =  $('#wishbox').html() 
                location.reload()
              }
        }
    })
}

function removeWhish(proId){
    let wishbox = document.getElementById('#wishbox');
    $.ajax({
        url:'/remove-whish/'+proId,
        method:'get',
        success:(response)=>{
           
            if(response){
                location.reload()
               // window.location.href = wishbox;
              }
        }
    })
}

function applyCoupon(event){
    event.preventDefault();
    let couponcode = document.getElementById('couponInput').value
    let couponid= document.getElementById('couponid').value

    let couponTotal = document.getElementById('couponTotal').value

    $.ajax({
        url:"/apply-coupon",
        data:{
             couponId:couponid,
             couponCode:couponcode,
             total:couponTotal,
        },
        method:"post",
        success:(response)=>{
            // alert(response)
            if(response){

                if(response.couponUsed){
                    $('#couponusederror').show()
                }else{
                let oldTotal = parseInt(document.getElementById('couponTotal').value)
                let discount = oldTotal - parseInt(response.total)
                document.getElementById('discount').innerHTML = response.total
                document.getElementById('couptotal').innerHTML = discount
                       $('#discountLabel').show()
                       $('#discounttd').show()
                       $('#discount').show()
                       $("#ordertotalhide").val(discount);
                       if(discount){
                       $("#couponapply").val("true");
                       $("#couponapplyid").val(couponid);
                       $("#couponTotal").val(discount);
                    }
                }
            }         
        }
    })
}

function applyWallet(event){
    event.preventDefault();
    let walletinput = document.getElementById('walletInput').value
     //let walletid= document.getElementById('walletid').value

    let couponTotal = document.getElementById('couponTotal').value

    $.ajax({
        url:"/apply-wallet",
        data:{
            walletInput:walletinput,
            total:couponTotal
            },
        method:"post",
        success:(response)=>{
            
            if(response){

                if(response.noBalance){
                    $('#nobalanceerror').show()
                }else{
                let Total = response.total;
                
                let walletAmount = Total - parseInt(response.amount)
                
                document.getElementById('couptotal').innerHTML = walletAmount
                       $("#ordertotalhide").val(walletAmount);
                    if(walletAmount){
                       $("#walletapply").val("true");
                       $("#walletapplyamount").val(response.amount); 
                       $("#couponTotal").val(walletAmount);                                            
                    }
                }
            }         
        }
    })
}


function sendData(e) {
    const searchResult = document.getElementById('searchResult');
    let match = e.value.match(/^[a-zA-Z ]*/)
    let match2 = e.value.match(/\s*/);
    if (match2[0] == e.value) {
        searchResult.innerHTML = "";
        return;
    }
    if (match[0] == e.value) {
        fetch('search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload: e.value })

        }).then(res => res.json()).then(data => {
            let payload = data.payload;
            searchResult.innerHTML = ''
            if (payload.legth < 1) {
                searchResult.innerHTML = '<p style="color:blue;">sorry. nothing found.</p>'
                return;
            }
            payload.forEach((item, index) => {
                if (index > 0) searchResult.innerHTML += '<hr>';
                
                searchResult.innerHTML += `<a style="color:blue;" href="/productdetails/${item._id}">${item.Name}</a>`
            });
        });
        return;
    }
    searchResult.innerHTML = '';

}

