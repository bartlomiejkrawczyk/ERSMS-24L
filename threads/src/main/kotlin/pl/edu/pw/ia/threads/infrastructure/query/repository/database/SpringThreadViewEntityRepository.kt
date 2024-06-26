package pl.edu.pw.ia.threads.infrastructure.query.repository.database

import org.springframework.data.domain.Pageable
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import org.springframework.stereotype.Repository
import pl.edu.pw.ia.threads.infrastructure.query.entity.ThreadViewEntity
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.Instant

@Repository
interface SpringThreadViewEntityRepository : ReactiveMongoRepository<ThreadViewEntity, String> {
    fun findByAccountId(accountId: String, pageable: Pageable) : Flux<ThreadViewEntity>
    fun countByAccountId(accountId: String) : Mono<Long>
    fun findByTitleIsContainingIgnoreCase(title: String, pageable: Pageable) : Flux<ThreadViewEntity>
    fun countByTitleIsContainingIgnoreCase(title: String) : Mono<Long>
    fun findByLastModifiedLessThanEqual(lastModified: Instant, pageable: Pageable) : Flux<ThreadViewEntity>
    fun countByLastModifiedGreaterThanEqual(lastModified: Instant) : Mono<Long>
    fun findByAccountId(accountId: String): Flux<ThreadViewEntity>
    fun findByThreadIdAndPostIdIsNull(threadId: String): Mono<ThreadViewEntity>
    fun findByThreadIdAndPostId(threadId: String, postId: String): Mono<ThreadViewEntity>
}