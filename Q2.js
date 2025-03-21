
document.addEventListener("DOMContentLoaded", function () {
    if (typeof window.data === "undefined" || !Array.isArray(window.data) || window.data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    console.log("Dữ liệu đã load:", window.data);

    const margin = { top: 40, right: 200, bottom: 50, left: 250 },
        width = 700,
        height = 400;

    const data1 = window.data.map(d => ({
        "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
        "Doanh số": parseFloat(d["Thành tiền"]) || 0
    }));

    const aggregatedData = data1.reduce((acc, item) => {
        const existingItem = acc.find(d => d["Nhóm hàng"] === item["Nhóm hàng"]);
        if (existingItem) {
            existingItem["Doanh số"] += item["Doanh số"];
        } else {
            acc.push({ "Nhóm hàng": item["Nhóm hàng"], "Doanh số": item["Doanh số"] });
        }
        return acc;
    }, []);

    aggregatedData.sort((a, b) => b["Doanh số"] - a["Doanh số"]);

    const svg = d3.select("#Q2")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(aggregatedData, d => d["Doanh số"])])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(aggregatedData.map(d => d["Nhóm hàng"]))
        .range([0, height])
        .padding(0.2);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("color", "#000")
        .style("padding", "8px 12px")
        .style("border-radius", "0px")
        .style("font-size", "13px")
        .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.3)")
        .style("display", "none")
        .style("text-align", "left");

    chart.selectAll(".bar")
        .data(aggregatedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d["Nhóm hàng"]))
        .attr("width", d => x(d["Doanh số"]))
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d["Nhóm hàng"]))
        .on("mouseover", function (event, d) {
            tooltip.style("display", "block")
                .html(`
                    <strong>Nhóm hàng:</strong> ${d["Nhóm hàng"]}<br>
                    <strong>Doanh số bán:</strong> ${Math.floor(d["Doanh số"] / 1_000_000).toLocaleString('vi-VN')} triệu VNĐ
                `)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
        });

    chart.selectAll(".label")
        .data(aggregatedData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d["Doanh số"]) - 5)
        .attr("y", d => y(d["Nhóm hàng"]) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(d => `${Math.floor(d["Doanh số"] / 1_000_000).toLocaleString('vi-VN')} triệu VNĐ`)
        .style("fill", "white")
        .style("font-size", "11px");

    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => `${Math.floor(d / 1_000_000).toLocaleString('vi-VN')}M`).ticks(7))
        .style("font-size", "11px");

    chart.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "11px")
        .style("text-anchor", "end");
});