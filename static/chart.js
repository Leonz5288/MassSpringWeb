var ctx = document.getElementById('loss_curve').getContext('2d');
var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            label: 'loss',
            data: [20, 10, 5, 3, 2, 1, 0.5, 0.1, 0.05],
            borderColor: 'rgba(25, 111, 209, 1)'
        }]
    },
    options: {
        scales: {
            yAxes: [{
                stacked: true
            }]
        }
    }
});