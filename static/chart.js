var ctx = document.getElementById('loss_curve').getContext('2d');
var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'loss',
            data: [],
            borderColor: 'rgba(25, 111, 209, 1)'
        }]
    },
    options: {
        scales: {
            yAxes: [{
                stacked: true,
                ticks: {
                    beginAtZero: false,
                    max: 0
                }
            }]
        }
    }
});

function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}