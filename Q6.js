document.addEventListener("DOMContentLoaded", function () {
    if (!window.data || !Array.isArray(window.data) || window.data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    console.log("Dữ liệu đã load:", window.data);

    const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
    const formatHour = d3.timeFormat("%H:%M");
    const formatDate = d3.timeFormat("%Y-%m-%d");

    const data1 = window.data.map(d => {
        const dateObj = parseDate(d["Thời gian tạo đơn"]);
        const date = formatDate(dateObj); 
        const hour = parseInt(d3.timeFormat("%H")(dateObj)); 
        return {
            "Ngày+Giờ": `${date} ${hour}`,
            "Khung giờ": `Từ ${hour.toString().padStart(2, '0')}:00 đến ${hour.toString().padStart(2, '0')}:59`,
            "Doanh số bán": parseFloat(d["Thành tiền"]) || 0
        };
    });

    const revenueStatsByHour = d3.rollups(
        data1,
        v => d3.sum(v, d => d["Doanh số bán"]) / d3.rollup(v, v => v.length, d => d["Ngày+Giờ"]).size,
        d => d["Khung giờ"]
    ).map(([hour, avgRevenue]) => ({
        "Khung giờ": hour,
        "Doanh số bán trung bình": avgRevenue
    }));

    revenueStatsByHour.sort((a, b) => parseInt(a["Khung giờ"].split(" ")[1]) - parseInt(b["Khung giờ"].split(" ")[1]));

    const margin = { top: 40, right: 20, bottom: 80, left: 100 },
        width = 900,
        height = 400;

    const svg = d3.select("#Q6")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(revenueStatsByHour.map(d => d["Khung giờ"]))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(revenueStatsByHour, d => d["Doanh số bán trung bình"])]).nice()
        .range([height, 0]);

    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

    chart.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${(d / 1_000).toLocaleString("vi-VN")}K`))
        .style("font-size", "10px");

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "8px")
        .style("border", "1px solid #ccc")
        .style("opacity", 0)
        .style("pointer-events", "none")
        .style("text-align", "left");

    chart.selectAll(".bar")
        .data(revenueStatsByHour)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d["Khung giờ"]))
        .attr("y", d => y(d["Doanh số bán trung bình"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Doanh số bán trung bình"]))
        .attr("fill", (d, i) => d3.schemeTableau10[i % 10])
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1)
                .html(`<strong>${d["Khung giờ"]}</strong><br>Doanh số bán trung bình: ${d["Doanh số bán trung bình"].toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VNĐ`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });

    chart.selectAll(".label")
        .data(revenueStatsByHour)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d["Khung giờ"]) + x.bandwidth() / 2)
        .attr("y", d => y(d["Doanh số bán trung bình"]) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "black")
        .text(d => `${(d["Doanh số bán trung bình"] / 1_000).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`);
});