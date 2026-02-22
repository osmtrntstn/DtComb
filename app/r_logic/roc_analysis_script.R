library(OptimalCutpoints)
library(dtComb)
if (!require("jsonlite")) install.packages("jsonlite")
library(jsonlite)

createROCPlotRoc <- function(input){
    print(">>> ADIM 1: Fonksiyon basladi. Marker sayisi kontrol ediliyor...")
    if(length(input$markerList) > 8){
        return(list(statusCode = "error", errorMessage = "Marker sayisi 8 den fazla olamaz"))
    }

    result <- tryCatch({
        markerNames <- unlist(input$markerList)
        print(paste(">>> ADIM 2: Secilen Markerlar:", paste(markerNames, collapse=", ")))

        if(input$dataInput == "example"){
            print(paste(">>> ADIM 3: Ornek veri yukleniyor:", input$exampleData))
            data(list = input$exampleData, package = "dtComb")
            df <- get(input$exampleData)
        } else {
            print(">>> ADIM 3: Kullanici verisi okunuyor...")
            data_text <- input$markers
            raw_sep <- input$delimiter
            sep_char <- if(!is.null(raw_sep) && nchar(as.character(raw_sep)) == 1) as.character(raw_sep) else "\t"
            df <- read.table(text = data_text, header = TRUE, sep = sep_char, check.names = FALSE)
        }

        print(paste(">>> ADIM 4: Veri seti boyutu:", nrow(df), "satir,", ncol(df), "sutun"))

        # Hata ihtimali yüksek olan yer: Marker sutunlarini secme
        print(">>> ADIM 5: Marker sutunlari data.frame'e donusturuluyor...")
        markers <- df[, markerNames, drop = FALSE]
        print(">>> ADIM 5 Tamamlandi.")

        status <- as.factor(df[[input$status]])
        print(">>> ADIM 6: Status kolonu yuklendi.")

        rocList <- list()
        AUC_table <- NULL
        std.err <- c()
        coords <- NULL
        coord.names <- c()

        for (i in 1:ncol(markers)) {
            currentMarker <- markerNames[i]
            print(paste(">>> ADIM 7: İşleniyor - Marker:", currentMarker, "(Sira:", i, ")"))

            roc.m1 <- suppressMessages(pROC::roc(status ~ markers[, i],
                                                direction = input$direction,
                                                quiet = TRUE))

            rocList[[i]] <- roc.m1

            print(paste(">>> ADIM 8: Koordinatlar aliniyor - Marker:", currentMarker))
            coord <- pROC::coords(roc.m1)
            coords <- rbind(coords, coord)
            coord.names <- c(coord.names, rep(currentMarker, nrow(coord)))

            print(paste(">>> ADIM 9: AUC ve CI hesaplaniyor - Marker:", currentMarker))
            auc <- pROC::ci.auc(roc.m1, method = "delong")
            AUC_table <- rbind(AUC_table, auc)

            var_val <- pROC::var(roc.m1, method = "delong")
            std.err <- c(std.err, sqrt(var_val))
        }

        print(">>> ADIM 10: AUC Tablosu olusturuluyor...")
        ROC_coordinates <- data.frame(coord.names, coords)
        colnames(ROC_coordinates) <- c("marker", "threshold", "specificity", "sensitivity")

        z.stat <- (AUC_table[, 2] - 0.5) / std.err
        p.val <- 2 * pt(-abs(z.stat), df = Inf)
        final_AUC_table <- data.frame(marker = markerNames,auc= AUC_table[, 2],seAuc= std.err, lowerLimit=AUC_table[, 1],upperLimit= AUC_table[, 3],z= z.stat,pValue= p.val)

        print(">>> ADIM 11: Optimal Cutpoints hesaplaniyor...")
        # ÖNEMLİ: cutoff.method ve event değişkenlerinin input içinde olduğundan emin olun


        MultComp_table<- NULL
        if(length(input$markerList)>1){
            combinations <-  as.matrix(combn(ncol(markers), 2))
            MultComp_table <- matrix(0, ncol(combinations), 6)

            firstColnames <- c()
            secondColnames <- c()
            for (i in 1:ncol(combinations)) {
              firstColnames <- c(firstColnames,colnames(markers)[[combinations[1,i]]])
              secondColnames <- c(secondColnames,colnames(markers)[[combinations[2,i]]])
              roccm1 <- pROC::roc.test(rocList[[combinations[1,i]]], rocList[[combinations[2,i]]], method = "delong")

              MultComp_table[i, ] <- cbind(
                roccm1$estimate[1],
                roccm1$estimate[2], abs(roccm1$estimate[1] - roccm1$estimate[2]),
                abs(roccm1$estimate[1] - roccm1$estimate[2]) / roccm1$statistic,
                roccm1$statistic, roccm1$p.value
              )
            }

            comp.names <- cbind(
              firstColnames,
              secondColnames
            )

            MultComp_table <- data.frame(comp.names, MultComp_table)
            colnames(MultComp_table) <- c("marker1A", "marker2B", "aucA", "aucB", "a_b", "se_a_b", "z", "pValue" )
        }

        allres <- list(
            rocCoordinates = ROC_coordinates,
            aucTable = final_AUC_table,
            markerNames = markerNames,
            multCompTable = MultComp_table,
            cuttoffMethod = input$cutoffMethod
        )
          statusFactored <- factor(ifelse(status == input$category, 1, 0), ordered = TRUE)

          data <- data.frame(markers, statusFactored)

        # Liste olarak tanımlayalım, data.frame hata verir
        cutoff.all <- list()
        diag_stat_marker_list <- list()
        threshold_list <- list()
        criterion_list <- list()

        for (i in 1:(ncol(data)-1)) {
          marker_name <- markerNames[i]
          print(paste(">>> İşleniyor:", marker_name)) # Debug için

          # 1. Optimal Cutpoint Hesaplama
          cutoff.m1 <- OptimalCutpoints::optimal.cutpoints(
            X = colnames(data)[i],
            status = colnames(data)[ncol(data)],
            tag.healthy = min(statusFactored),
            methods = input$cutoffMethod,
            data = data
          )

          cutoff.all[[paste0("cutoff_m_", i)]] <- cutoff.m1

          # 2. Threshold ve Karışıklık Matrisi Değerleri
          # Not: Birden fazla optimal cutoff dönebilir, [1] ile ilkini garantiye alıyoruz
          threshold.m1 <- cutoff.m1[[input$cutoffMethod]]$Global$optimal.cutoff

          TP <- cutoff.m1[[input$cutoffMethod]]$Global$measures.acc$n$d - threshold.m1$FN
          TN <- cutoff.m1[[input$cutoffMethod]]$Global$measures.acc$n$h - threshold.m1$FP
          FP <- threshold.m1$FP
          FN <- threshold.m1$FN

          # 3. epi.tests için Tablo Oluşturma
          # Sıralama: TP, FP, FN, TN şeklinde olmalı
          best.m1.tbl <- as.table(matrix(c(TP[1], FP[1], FN[1], TN[1]), nrow = 2, byrow = TRUE))

          # 4. Diagnostik İstatistikler
          DiagStatMarker1 <- epiR::epi.tests(best.m1.tbl, conf.level = as.numeric(input$confLevel))
          DiagStatMarker1$detail <- DiagStatMarker1$detail[-c(6, 7, 8, 13, 14), ] # Gereksiz satırları sil

          names(DiagStatMarker1$tab) <- c("outComePlus","outComeMinus","total" )

          # İsimlendirme düzenlemesi
          # epi.tests çıktısı karmaşık bir liste olduğu için direkt listeye ekliyoruz
          diag_stat_marker_list[[marker_name]] <- DiagStatMarker1
          threshold_list[[paste0("threshold_marker_", marker_name)]] <- threshold.m1$cutoff[1]
          criterion_list[[paste0("criterion_", marker_name)]] <- cutoff.m1[[input$cutoffMethod]]$Global$optimal.criterion[1]
          # 5. Sonuçları allres içine aktarma

        }

        # Tüm istatistikleri toplu olarak da ekleyelim
        allres[["diag_stat_marker_all"]] <- diag_stat_marker_list
        allres[["criterion_list"]] <- criterion_list
        allres[["threshold_list"]] <- threshold_list




#         print(allres)
        print(">>> SONUÇ: JSON Donusturuluyor...")
        return(jsonlite::toJSON(allres, pretty = TRUE, auto_unbox = TRUE, force = TRUE))

    }, error = function(e) {
        print(paste("!!! HATA YAKALANDI:", e$message))
        print(e)
        stop(e$message)
    })
}