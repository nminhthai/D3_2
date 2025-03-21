document.addEventListener("DOMContentLoaded", function () {
    if (typeof window.data === "undefined" || !Array.isArray(window.data) || window.data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    console.log("Dữ liệu đã load:", window.data);

    const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
    const formatDate = d3.timeFormat("%Y-%m-%d");
    const formatMonth = d3.timeFormat("Tháng %m");
    const tableau10 = d3.schemeTableau10;

    const data1 = window.data.map(d => {
        const dateObj = parseDate(d["Thời gian tạo đơn"]);
        return {
            "Ngày tạo đơn": formatDate(dateObj),
            "Tháng": formatMonth(dateObj),
            "Doanh số bán": parseFloat(d["Thành tiền"]) || 0
        };
    });


    const revenueByMonth = d3.rollups(
        data1,
        v => d3.sum(v, d => d["Doanh số bán"]),
        d => d["Tháng"]
    ).map(([month, revenue]) => ({ "Tháng": month, "Doanh số bán": revenue }));

    revenueByMonth.sort((a, b) => a["Tháng"].localeCompare(b["Tháng"]));


    const margin = { top: 40, right: 20, bottom: 50, left: 100 },
        width = 700,
        height = 400;

    const svg = d3.select("#Q3")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(revenueByMonth.map(d => d["Tháng"]))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(revenueByMonth, d => d["Doanh số bán"]) ]).nice()
        .range([height, 0]);

    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "8px")
        .style("text-anchor", "middle");

    chart.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${Math.floor(d / 1_000_000)}M`))
        .style("font-size", "8px");

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
        .data(revenueByMonth)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d["Tháng"]))
        .attr("y", d => y(d["Doanh số bán"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Doanh số bán"]))
        .attr("fill", (d, i) => tableau10[i % tableau10.length])
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1)
                .html(`<strong>${d["Tháng"]}</strong><br>Doanh số bán: ${Math.floor(d["Doanh số bán"] / 1_000_000)} triệu VNĐ`)
                .style("left", `${event.pageX - tooltip.node().offsetWidth - 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX - tooltip.node().offsetWidth - 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });

    chart.selectAll(".label")
        .data(revenueByMonth)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d["Tháng"]) + x.bandwidth() / 2)
        .attr("y", d => y(d["Doanh số bán"]) + 10)
        .attr("text-anchor", "middle")
        .text(d => `${Math.floor(d["Doanh số bán"] / 1_000_000)} triệu VNĐ`)
        .style("fill", "white")
        .style("font-size", "7px")
        .style("font-weight", "normal");
});
